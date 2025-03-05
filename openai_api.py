# ai_model_integration/openai_api.py
import openai
import os

def generate_text_openai(api_key, model_name="gpt-3.5-turbo-instruct", prompt_text="Write a short story about a robot learning to love."):
    """
    使用 OpenAI API 生成文本。

    Args:
        api_key (str): 您的 OpenAI API 密钥。
        model_name (str, optional): OpenAI 模型名称. 默认为 "gpt-3.5-turbo-instruct" (一个快速且经济的模型).
        prompt_text (str, optional): 生成文本的起始提示文本. 默认为 "Write a short story about a robot learning to love.".

    Returns:
        str: 生成的文本结果.
        str: 错误信息，如果生成过程中发生错误，否则为 None.
    """
    try:
        openai.api_key = api_key  # 设置 OpenAI API 密钥

        response = openai.completions.create(
            model=model_name,
            prompt=prompt_text,
            max_tokens=100,      # 生成文本的最大 token 数量
            n=1,                # 返回的文本序列数量
            stop=None,           # 设置停止生成文本的 token (None 表示不设置)
            temperature=0.7,     # 控制生成文本的随机性 (0.0 - 1.0, 值越大越随机)
        )

        # 从 API 响应中提取生成的文本
        generated_text = response.choices[0].text.strip()

        return generated_text, None  # 返回生成的文本和无错误信息

    except openai.APIError as e:
        error_message = f"OpenAI API 错误: {str(e)}"
        print(error_message)
        return None, error_message
    except Exception as e:
        error_message = f"文本生成过程中发生错误: {str(e)}"
        print(error_message)
        return None, error_message


# 示例用法 (可选，但推荐用于测试模块)
if __name__ == "__main__":
    # --- !!! 重要安全提示 !!! ---
    # *** 永远不要在代码中硬编码您的 OpenAI API 密钥! ***
    # *** 这只是为了 *本地测试* 目的的示例代码。 ***
    # *** 在实际应用中，请使用更安全的方法管理 API 密钥，例如： ***
    # *** - 环境变量 ***
    # *** - 配置文件 ***
    # *** - 密钥管理服务 ***
    # --- !!! 重要安全提示 !!! ---

    # 从环境变量中获取 API 密钥 (推荐的本地测试方法)
    openai_api_key = os.environ.get("OPENAI_API_KEY")

    if not openai_api_key:
        print("错误：请设置 OPENAI_API_KEY 环境变量或在下方直接输入API密钥 (仅用于本地测试!)")
        #  !!!  取消注释下一行并替换为您的 API 密钥进行本地测试 (非常不安全，仅限本地测试!)  !!!
        # openai_api_key = "YOUR_OPENAI_API_KEY_HERE"  #  <---  !!!  替换为您的 API 密钥  !!!
        if not openai_api_key:
            exit() # 如果环境变量未设置，且用户没有手动输入，则退出程序

    print("--- 使用 OpenAI API (gpt-3.5-turbo-instruct 模型) 生成文本 ---")
    generated_text_openai_default, error_openai_default = generate_text_openai(
        api_key=openai_api_key,
        prompt_text="If a robot could dream, what might it dream about?"
    )

    if generated_text_openai_default:
        print("生成的文本 (OpenAI API, gpt-3.5-turbo-instruct 模型):")
        print(generated_text_openai_default)
    else:
        print(f"生成文本失败 (OpenAI API, gpt-3.5-turbo-instruct 模型): {error_openai_default}")

    print("\n--- 尝试使用其他模型 (text-davinci-003 模型) ---")
    generated_text_davinci, error_davinci = generate_text_openai(
        api_key=openai_api_key,
        model_name="text-davinci-003",  #  注意: text-davinci-003 模型可能已弃用或不再免费，请根据 OpenAI 最新文档选择可用模型
        prompt_text="Explain quantum physics in simple terms."
    )

    if generated_text_davinci:
        print("生成的文本 (OpenAI API, text-davinci-003 模型):")
        print(generated_text_davinci)
    else:
        print(f"生成文本失败 (OpenAI API, text-davinci-003 模型): {error_davinci}")