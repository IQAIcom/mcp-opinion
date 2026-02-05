/**
 * Shared error handling utility for CLOB trading tools
 */
export function handleClobError(error: unknown, operationName: string): string {
	if (error instanceof Error) {
		if (error.message.includes("OPINION_PRIVATE_KEY")) {
			return "Error: OPINION_PRIVATE_KEY environment variable is required for trading operations.";
		}
		if (error.message.includes("Python")) {
			return `Error: ${error.message}. Make sure Python 3 and opinion-clob-sdk are installed (pip install opinion-clob-sdk).`;
		}
		return `Error ${operationName}: ${error.message}`;
	}
	return `An unknown error occurred while ${operationName}`;
}
