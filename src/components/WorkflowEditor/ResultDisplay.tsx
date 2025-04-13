// src/components/WorkflowEditor/ResultDisplay.tsx
import React from 'react';
import { Alert, Box, Typography } from '@mui/material';

interface ResultDisplayProps {
    result: any; // 暂时使用 any，稍后会细化
}

// 定义 Result 的可能类型
type ResultDataType =
    | { type: 'text'; data: string; title?: string; description?: string }
    | { type: 'image'; data: string; title?: string; description?: string }
    | { type: 'audio'; data: string; title?: string; description?: string }
    | { type: 'error'; message: string }
    | null; // 没有结果


const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
    // 类型守卫函数，用于缩小 result 的类型
    const isResultData = (result: any): result is Exclude<ResultDataType, null> => { // 从 ResultDataType 中排除 null
        return result !== null && typeof result === 'object' && typeof result.type === 'string';
    };

    if (!result) {
        return (
            <Box p={2}>
                <Typography variant="body2" color="text.secondary">
                    No Result.
                </Typography>
            </Box>
        );
    }

    if (typeof result === 'string') {
        return (
            <Box p={2}>
                <Typography variant="body1">{result}</Typography>
            </Box>
        );
    }

    // 使用类型守卫和可选链
    if (!isResultData(result)) {
        return (
            <Box p={2}>
                <Alert severity="error">
                    Invalid result format. The result is: {JSON.stringify(result)}
                </Alert>
            </Box>
        );
    }

    // isResultData 已经排除了 null, 这里不需要再次检查 result 是否为 null
    switch (result.type) {
        case 'text':
            return (
                <Box p={2}>
                    <Typography variant="h6">{result.title ?? ''}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {result.description ?? ''}
                    </Typography>
                    <Typography variant="body1">{result.data}</Typography>
                </Box>
            );
        case 'image':
            return (
                <Box p={2}>
                    <Typography variant="h6">{result.title ?? ''}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {result.description ?? ''}
                    </Typography>
                    <img src={result.data} alt={result.title ?? 'Result Image'} style={{ maxWidth: '100%' }} />
                </Box>
            );
        case 'audio':
            return (
                <Box p={2}>
                    <Typography variant="h6">{result.title ?? ''}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {result.description ?? ''}
                    </Typography>
                    <audio controls src={result.data}>
                        Your browser does not support the audio element.
                    </audio>
                </Box>
            );
        case 'error':
            return (
                <Box p={2}>
                    <Alert severity="error">{result.message}</Alert>
                </Box>
            );
        default:
            return (
                <Box p={2}>
                    <Alert severity="error">Unknown result type: {(result as any).type}</Alert>
                </Box>
            );
    }
};

export default ResultDisplay;