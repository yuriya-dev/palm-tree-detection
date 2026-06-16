package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"mopad/server/internal/dto"
	"mopad/server/internal/middleware"
	"mopad/server/internal/service"
)

// Login godoc
// POST /api/v1/auth/login
func (h *Handler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respond(c, http.StatusBadRequest, nil, "Permintaan tidak valid: "+err.Error(), nil)
		return
	}

	result, err := h.authService.Login(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			respond(c, http.StatusUnauthorized, nil, "Email atau password tidak valid", nil)
			return
		}
		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, result, "Login berhasil", nil)
}

// Me godoc
// GET /api/v1/auth/me  (requires Bearer token)
func (h *Handler) Me(c *gin.Context) {
	email, _ := c.Get(middleware.ContextKeyEmail)
	role, _ := c.Get(middleware.ContextKeyRole)
	userID, _ := c.Get(middleware.ContextKeyUserID)

	respond(c, http.StatusOK, gin.H{
		"id":    userID,
		"email": email,
		"role":  role,
	}, "OK", nil)
}
