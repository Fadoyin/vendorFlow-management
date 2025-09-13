  public validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    // Check length (reduced from 8 to 6)
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    // Check for uppercase letter (optional)
    const hasUpperCase = /[A-Z]/.test(password);
    
    // Check for lowercase letter (optional)
    const hasLowerCase = /[a-z]/.test(password);
    
    // Check for number (optional)
    const hasNumber = /\d/.test(password);
    
    // Check for special character (optional)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    // Only require length, other criteria are optional but improve strength
    const criteriaCount = [
      password.length >= 6,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar
    ].filter(Boolean).length;

    // Determine strength based on criteria met
    if (criteriaCount >= 4 && password.length >= 8) {
      strength = 'strong';
    } else if (criteriaCount >= 2) {
      strength = 'medium';
    } else {
      strength = 'weak';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  }
