# ai_model_integration/hf_transformers.py
from transformers import pipeline, set_seed

def generate_text_hf(model_name="gpt2", prompt_text="Once upon a time"):
    """
    使用 Hugging Face Transformers 库生成文本。

    Args:
        model_name (str, optional): Hugging Face 模型名称或路径. 默认为 "gpt2" (小型 GPT-2 模型).
        prompt_text (str, optional): 生成文本的起始提示文本. 默认为 "Once upon a time".

    Returns:
        str: 生成的文本结果.
        str: 错误信息，如果生成过程中发生错误，否则为 None.
    """
    try:
        # 设置随机种子以获得可重复的结果 (仅用于示例目的，生产环境可能不需要)
        set_seed(42)

        # 创建文本生成 pipeline
        generator = pipeline('text-generation', model=model_name)

        # 使用 pipeline 生成文本
        generation_output = generator(prompt_text,
                                    max_length=50,      # 生成文本的最大长度
                                    num_return_sequences=1) # 返回的文本序列数量

        # 从 pipeline 输出中提取生成的文本
        generated_text = generation_output[0]['generated_text']

        return generated_text, None  # 返回生成的文本和无错误信息

    except Exception as e:
        error_message = f"文本生成过程中发生错误: {str(e)}"
        print(error_message) # 打印错误信息到控制台，方便调试
        return None, error_message # 返回 None 和错误信息


# 示例用法 (可选，但推荐用于测试模块)
if __name__ == "__main__":
    print("--- 使用默认模型 gpt2 生成文本 ---")
    generated_text_default, error_default = generate_text_hf()
    if generated_text_default:
        print("生成的文本 (默认模型):")
        print(generated_text_default)
    else:
        print(f"生成文本失败 (默认模型): {error_default}")

    print("\n--- 使用更大的模型 gpt2-medium 生成文本 ---")
    generated_text_medium, error_medium = generate_text_hf(model_name="gpt2-medium", prompt_text="The weather is nice today, so")
    if generated_text_medium:
        print("生成的文本 (gpt2-medium 模型):")
        print(generated_text_medium)
    else:
        print(f"生成文本失败 (gpt2-medium 模型): {error_medium}")

    print("\n--- 尝试使用不存在的模型 (用于测试错误处理) ---")
    generated_text_invalid, error_invalid = generate_text_hf(model_name="non-existent-model", prompt_text="This should fail")
    if generated_text_invalid:
        print("生成的文本 (无效模型):")
        print(generated_text_invalid)
    else:
        print(f"生成文本失败 (无效模型): {error_invalid}")