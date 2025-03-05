# utils/string_utils.py
import re

def sanitize_filename(filename: str) -> str:
    """
    Sanitizes a filename by removing or replacing invalid characters.

    Args:
        filename: The filename to sanitize.

    Returns:
        A sanitized filename.
    """
    # Replace spaces with underscores
    filename = filename.replace(" ", "_")
    # Remove characters that are not alphanumeric, underscores, or dots
    filename = re.sub(r'[^\w.]', '', filename)
    return filename

# utils/config_utils.py
import json
from typing import Dict, Any, Optional

def load_config(config_path: str) -> Dict[str, Any]:
    """
    Loads configuration from a JSON file.

    Args:
        config_path: Path to the JSON configuration file.

    Returns:
        A dictionary containing the configuration.
        Raises FileNotFoundError if the file is not found, or JSONDecodeError if parsing fails.
    """
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        raise FileNotFoundError(f"Configuration file not found at: {config_path}")
    except json.JSONDecodeError:
        raise json.JSONDecodeError(f"Error parsing JSON in configuration file: {config_path}", "", 0)

# Example usage (optional, you can remove this if you only need the functions)
if __name__ == "__main__":
    # String utils example
    original_filename = "My File Name with spaces and !@#$chars.txt"
    sanitized_name = sanitize_filename(original_filename)
    print(f"Original filename: '{original_filename}'")
    print(f"Sanitized filename: '{sanitized_name}'")

    # Config utils example (assuming you have a config.json file in the same directory)
    try:
        config = load_config("config.json") # You might need to create a dummy config.json file for testing
        print("\nLoaded configuration:")
        print(config)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"\nError loading configuration: {e}")