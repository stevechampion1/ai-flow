# config.py
import os
from typing import Dict, Any, Optional
from utils.string_utils import load_config  # Import the config loading utility

# --- Default Configuration ---
DEFAULT_CONFIG: Dict[str, Any] = {
    "app_name": "AI-Flow",
    "version": "0.1.0",
    "server": {
        "host": "0.0.0.0",
        "port": 8000,
        "reload": False  # Enable reload for development, disable for production
    },
    "database": {
        "type": "inmemory", # Options: "inmemory", "postgresql", etc.
        "url": None # Connection URL if applicable
    },
    "ai_models": {
        "default_text_generation_model": "gpt-2",
        # ... other default AI model configurations ...
    },
    "api_keys": {
        "openai": None, # Consider using environment variables instead of hardcoding
        "huggingface": None,
        # ... other API keys ...
    },
    "feature_flags": {
        "enable_plugin_system": False,
        "show_debug_info": True,
        # ... other feature flags ...
    }
    # ... add more default settings as needed ...
}

# --- Configuration File Path ---
CONFIG_FILE_PATH = os.getenv("AI_FLOW_CONFIG_PATH", "config.json") # Environment variable override, defaults to "config.json"

# --- Load Configuration ---
_loaded_config: Dict[str, Any] = {}

try:
    _file_config = load_config(CONFIG_FILE_PATH)
    _loaded_config.update(_file_config) # Merge file config into loaded config
except FileNotFoundError:
    print(f"Configuration file not found at: {CONFIG_FILE_PATH}. Using default configuration.")
except Exception as e: # Catch any other potential errors during config loading
    print(f"Error loading configuration from {CONFIG_FILE_PATH}: {e}. Using default configuration.")

# --- Merge Default Configuration ---
_loaded_config = {**DEFAULT_CONFIG, **_loaded_config} # File config overrides defaults

# --- Environment Variable Overrides (Optional but Recommended) ---
# Example: Override server port using environment variable AI_FLOW_SERVER_PORT
if "AI_FLOW_SERVER_PORT" in os.environ:
    try:
        _loaded_config["server"]["port"] = int(os.environ["AI_FLOW_SERVER_PORT"])
    except ValueError:
        print(f"Invalid environment variable AI_FLOW_SERVER_PORT. Using configuration file value: {_loaded_config['server']['port']}")
# Add more environment variable overrides as needed, following the same pattern

# --- Configuration Access Functions ---

def get_config() -> Dict[str, Any]:
    """
    Returns the entire loaded configuration dictionary.
    """
    return _loaded_config

def get_setting(key_path: str, default: Optional[Any] = None) -> Any:
    """
    Retrieves a specific configuration setting using a dot-separated key path (e.g., "server.port").

    Args:
        key_path: Dot-separated path to the setting (e.g., "database.url").
        default: Default value to return if the setting is not found.

    Returns:
        The configuration setting value, or the default value if not found.
    """
    keys = key_path.split(".")
    config = _loaded_config
    for key in keys:
        if isinstance(config, dict) and key in config:
            config = config[key]
        else:
            return default # Setting not found, return default
    return config # Return the found setting

# --- Example Usage (Optional - for testing) ---
if __name__ == "__main__":
    # Create a dummy config.json for testing if you don't have one
    # You can comment this out or remove it if you have your own config.json
    if not os.path.exists("config.json"):
        with open("config.json", "w") as f:
            import json
            json.dump({
                "server": {
                    "port": 8080, # Override default port in config.json
                    "reload": True # Override default reload in config.json
                },
                "database": {
                    "type": "postgresql",
                    "url": "postgresql://user:password@host:port/database"
                },
                "api_keys": {
                    "openai": "CONFIG_FILE_OPENAI_KEY" # Key from config file
                }
            }, f, indent=4)
        print("Created a dummy config.json for testing.")

    # Example of getting full config
    full_config = get_config()
    print("Full Configuration:")
    import json # for pretty printing
    print(json.dumps(full_config, indent=4))

    # Example of getting specific settings
    app_name = get_setting("app_name")
    server_port = get_setting("server.port")
    database_url = get_setting("database.url")
    openai_key = get_setting("api_keys.openai")
    non_existent_setting = get_setting("non.existent.setting", "default_value") # With default

    print(f"\nApp Name: {app_name}")
    print(f"Server Port: {server_port}")
    print(f"Database URL: {database_url}")
    print(f"OpenAI API Key: {openai_key}")
    print(f"Non-existent Setting (with default): {non_existent_setting}")