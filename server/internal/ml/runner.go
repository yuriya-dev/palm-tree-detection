package ml

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"
	"time"

	"mopad/server/internal/port"
)

type HTTPRunner struct {
	baseURL string
	client  *http.Client
}

func NewHTTPRunner(baseURL string) *HTTPRunner {
	return &HTTPRunner{
		baseURL: strings.TrimRight(baseURL, "/"),
		client: &http.Client{
			Timeout: 20 * time.Second,
		},
	}
}

func (r *HTTPRunner) Predict(ctx context.Context, req port.MLPredictRequest) (port.MLPrediction, error) {
	if r.baseURL == "" {
		return port.MLPrediction{}, fmt.Errorf("ml service url is empty")
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	fileWriter, err := writer.CreateFormFile("image", req.ImageName)
	if err != nil {
		return port.MLPrediction{}, err
	}

	if _, err := fileWriter.Write(req.ImageBytes); err != nil {
		return port.MLPrediction{}, err
	}

	_ = writer.WriteField("site", req.Site)
	_ = writer.WriteField("model", req.Model)
	_ = writer.WriteField("confidence_threshold", strconv.FormatFloat(req.ConfidenceThreshold, 'f', 2, 64))

	if err := writer.Close(); err != nil {
		return port.MLPrediction{}, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, r.baseURL+"/predict", &body)
	if err != nil {
		return port.MLPrediction{}, err
	}
	httpReq.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := r.client.Do(httpReq)
	if err != nil {
		return port.MLPrediction{}, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return port.MLPrediction{}, err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return port.MLPrediction{}, fmt.Errorf("ml service error: %s", string(respBody))
	}

	type payload struct {
		Success    bool              `json:"success"`
		Prediction port.MLPrediction `json:"prediction"`
		Message    string            `json:"message"`
	}

	var parsed payload
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return port.MLPrediction{}, err
	}

	if !parsed.Success {
		if parsed.Message == "" {
			parsed.Message = "ml service returned unsuccessful response"
		}
		return port.MLPrediction{}, fmt.Errorf(parsed.Message)
	}

	if parsed.Prediction.Status == "" {
		return port.MLPrediction{}, fmt.Errorf("ml service did not return status")
	}

	return parsed.Prediction, nil
}
