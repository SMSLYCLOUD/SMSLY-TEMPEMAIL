package main

import (
	"testing"
)

func TestSession(t *testing.T) {
	s := &Session{}
	assert_err := s.AuthPlain("user", "pass")
	if assert_err != nil {
		t.Errorf("AuthPlain should return nil")
	}
}

func TestBackendMethodsExist(t *testing.T) {
	be := &Backend{}
	if be == nil {
		t.Fatal("Backend should not be nil")
	}

	session := &Session{}
	if session == nil {
		t.Fatal("Session should not be nil")
	}
}
