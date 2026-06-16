package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const (
	ContextKeyUserID = "userID"
	ContextKeyEmail  = "email"
	ContextKeyRole   = "role"
)

// RequireAuth validates a Bearer JWT from the Authorization header.
// On success it stores userID, email, and role in the gin context.
func RequireAuth(jwtSecret string) gin.HandlerFunc {
	secret := []byte(jwtSecret)

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Token otentikasi diperlukan",
			})
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return secret, nil
		}, jwt.WithValidMethods([]string{"HS256"}))

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Token tidak valid atau sudah kadaluarsa",
			})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Token tidak valid",
			})
			return
		}

		// sub is stored as float64 by JWT library
		if sub, ok := claims["sub"]; ok {
			c.Set(ContextKeyUserID, sub)
		}
		if email, ok := claims["email"].(string); ok {
			c.Set(ContextKeyEmail, email)
		}
		if role, ok := claims["role"].(string); ok {
			c.Set(ContextKeyRole, role)
		}

		c.Next()
	}
}

// RequireRole returns a middleware that allows only the specified roles.
// Must be used AFTER RequireAuth.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}

	return func(c *gin.Context) {
		role, _ := c.Get(ContextKeyRole)
		roleStr, _ := role.(string)
		if _, ok := allowed[roleStr]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Akses ditolak: hak akses tidak mencukupi",
			})
			return
		}
		c.Next()
	}
}
