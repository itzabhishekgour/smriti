package com.tinexus.smriti.exception;

public class AccountRequiresLinkException extends RuntimeException {
    public AccountRequiresLinkException(String message) {
        super(message);
    }
}
