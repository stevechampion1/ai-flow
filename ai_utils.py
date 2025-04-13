# ai_model_integration/ai_utils.py
import re

def clean_text(text):
    """
    对文本进行基本清洗，例如去除多余空格、换行符等。

    Args:
        text (str): 输入文本字符串.

    Returns:
        str: 清洗后的文本字符串.
    """
    if not isinstance(text, str):
        return ""  # 如果输入不是字符串，返回空字符串

    # 去除首尾空格
    text = text.strip()
    # 将多个空格替换为一个空格
    text = re.sub(r'\s+', ' ', text)
    # 去除换行符
    text = text.replace('\n', ' ')
    return text

def extract_keywords(text, num_keywords=5):
    """
    (示例) 从文本中提取关键词 (这里只是一个简单的占位符实现，实际应用中可以使用更复杂的关键词提取算法).

    Args:
        text (str): 输入文本字符串.
        num_keywords (int, optional): 要提取的关键词数量. 默认为 5.

    Returns:
        list: 关键词列表 (字符串列表).
    """
    if not isinstance(text, str):
        return [] # 如果输入不是字符串，返回空列表

    # 简单地按空格分割文本，取前 N 个词作为关键词 (仅为示例)
    words = text.split()
    keywords = words[:num_keywords]
    return keywords

def normalize_data(data, normalization_type="min-max"):
    """
    (占位符) 对数据进行归一化处理 (这里只是一个占位符，实际应用中需要根据数据类型和需求实现具体的归一化逻辑).

    Args:
        data (list or numpy.ndarray): 要归一化的数据 (假设是数值型数据).
        normalization_type (str, optional): 归一化类型. 默认为 "min-max".  可以扩展支持其他类型，例如 "z-score", "decimal scaling" 等.

    Returns:
        list or numpy.ndarray: 归一化后的数据.
    """
    # 这是一个占位符实现，实际应用中需要根据具体的数据类型和归一化需求来实现
    print(f"警告: normalize_data 函数是一个占位符实现，尚未实现具体的归一化逻辑. 默认返回原始数据.")
    return data # 默认返回原始数据


# 示例用法 (可选，但推荐用于测试模块)
if __name__ == "__main__":
    print("--- 测试 clean_text 函数 ---")
    test_text = "  This  is  a  text  with   extra   spaces and \n new lines.  "
    cleaned_text = clean_text(test_text)
    print(f"原始文本: '{test_text}'")
    print(f"清洗后的文本: '{cleaned_text}'")

    print("\n--- 测试 extract_keywords 函数 ---")
    sample_text = "AI-Flow is an open-source low-code platform for AI application development. It simplifies AI development."
    keywords = extract_keywords(sample_text, num_keywords=7)
    print(f"原始文本: '{sample_text}'")
    print(f"提取的关键词 (前 7 个): {keywords}")

    print("\n--- 测试 normalize_data 函数 (占位符) ---")
    sample_data = [10, 20, 30, 40, 50]
    normalized_data = normalize_data(sample_data, normalization_type="min-max")
    print(f"原始数据: {sample_data}")
    print(f"归一化后的数据 (min-max, 占位符实现): {normalized_data}")