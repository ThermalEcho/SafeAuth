import { Alert } from "react-native";

// -----------------------------------------------------------------------------
// Shared constants
// -----------------------------------------------------------------------------

const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_ALERT_BUTTON_LABEL = "OK";
const DEFAULT_VALIDATION_MESSAGE = "Validation failed";

export type ValidationResult = boolean | string;
export type ValidationRule = (value: unknown) => ValidationResult;
export type ValidationRules = Record<string, ValidationRule>;

/**
 * Shows a simple native alert with the supplied title and message.
 *
 * @param title - The dialog title.
 * @param message - The message shown to the user.
 */
export function showAlert(title: string, message: string): void {
  Alert.alert(title, message);
}

/**
 * Shows a native alert with a single confirmation action.
 *
 * @param title - The dialog title.
 * @param message - The message shown to the user.
 * @param onOk - The callback invoked when the confirmation button is pressed.
 */
export function showAlertWithAction(title: string, message: string, onOk: () => void): void {
  Alert.alert(title, message, [{ text: DEFAULT_ALERT_BUTTON_LABEL, onPress: onOk }]);
}

/**
 * Validates whether a string looks like an email address.
 *
 * @param emailAddress - The email address to validate.
 * @returns `true` when the value matches the expected email pattern.
 */
export function validateEmail(emailAddress: string): boolean {
  return EMAIL_ADDRESS_PATTERN.test(emailAddress);
}

/**
 * Validates a map of values against a map of field rules.
 *
 * Each rule can return `true` when the value is valid or a string describing
 * the validation problem when it is not.
 *
 * @param values - The values being validated.
 * @param rules - The validation rules keyed by field name.
 * @returns The first validation error message, or `null` when all rules pass.
 */
export function validateForm(values: Record<string, unknown>, rules: ValidationRules): string | null {
  for (const [fieldName, validator] of Object.entries(rules)) {
    const validationResult = validator(values[fieldName]);

    if (validationResult !== true) {
      return typeof validationResult === "string" ? validationResult : DEFAULT_VALIDATION_MESSAGE;
    }
  }

  return null;
}
