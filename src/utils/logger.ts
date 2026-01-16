/**
 * Logger Utility for hazo_pdf
 * Provides a unified logging interface that can use hazo_logs or fallback to console
 */

/**
 * Logger interface matching hazo_logs Logger type
 * This allows consumers to pass in their own logger instance
 */
export interface Logger {
  info: (message: string, data?: Record<string, unknown>) => void;
  debug: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
}

/**
 * Fallback logger using console
 * Used when no external logger is provided
 */
const console_logger: Logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    if (data) {
      console.log(`[hazo_pdf] ${message}`, data);
    } else {
      console.log(`[hazo_pdf] ${message}`);
    }
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (data) {
      console.debug(`[hazo_pdf] ${message}`, data);
    } else {
      console.debug(`[hazo_pdf] ${message}`);
    }
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    if (data) {
      console.warn(`[hazo_pdf] ${message}`, data);
    } else {
      console.warn(`[hazo_pdf] ${message}`);
    }
  },
  error: (message: string, data?: Record<string, unknown>) => {
    if (data) {
      console.error(`[hazo_pdf] ${message}`, data);
    } else {
      console.error(`[hazo_pdf] ${message}`);
    }
  },
};

/**
 * Current logger instance
 * Defaults to console_logger, can be set via set_logger()
 */
let current_logger: Logger = console_logger;

/**
 * Set the logger instance to use throughout hazo_pdf
 * @param logger - Logger instance (from hazo_logs or custom), or undefined to reset to console
 */
export function set_logger(logger: Logger | undefined): void {
  current_logger = logger || console_logger;
}

/**
 * Get the current logger instance
 * @returns Current logger (either hazo_logs instance or console fallback)
 */
export function get_logger(): Logger {
  return current_logger;
}
