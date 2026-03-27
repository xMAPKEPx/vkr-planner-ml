'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    Subtask,
    updateSubtask,
    deleteSubtask,
} from '@/store/slices/subtaskSlice';
import {
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Checkbox,
    Chip,
    TextField,
    Button,
    Collapse,
    Typography,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Add as AddIcon,
} from '@mui/icons-material';

interface Props {
    taskId: number;
    subtasks: Subtask[];
    onAddSubtask: (parentId: number | null) => void;
}

export default function SubtaskTree({ taskId, subtasks, onAddSubtask }: Props) {
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector((state) => state.subtasks);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');

    // Строим дерево из плоского списка
    const buildTree = (parentId: number | null = null): Subtask[] => {
        return subtasks
            .filter((s) => s.parentId === parentId)
            .sort((a, b) => a.order - b.order);
    };

    const handleToggleStatus = (subtask: Subtask) => {
        dispatch(
            updateSubtask({
                id: subtask.id,
                data: { status: subtask.status === 'DONE' ? 'TODO' : 'DONE' },
            }),
        );
    };

    const handleStartEdit = (subtask: Subtask) => {
        setEditingId(subtask.id);
        setEditTitle(subtask.title);
    };

    const handleSaveEdit = (subtaskId: number) => {
        dispatch(
            updateSubtask({
                id: subtaskId,
                data: { title: editTitle },
            }),
        );
        setEditingId(null);
    };

    const handleDelete = (subtaskId: number) => {
        if (confirm('Удалить эту подзадачу?')) {
            dispatch(deleteSubtask(subtaskId));
        }
    };

    const toggleExpand = (subtaskId: number) => {
        setExpanded((prev) => ({ ...prev, [subtaskId]: !prev[subtaskId] }));
    };

    const renderSubtask = (subtask: Subtask, level: number = 0) => {
        const hasChildren = subtasks.some((s) => s.parentId === subtask.id);
        const isExpanded = expanded[subtask.id];

        return (
            <Box key={subtask.id}>
                <ListItem
                    sx={{
                        pl: level * 3,
                        bgcolor:
                            subtask.status === 'DONE'
                                ? 'action.disabledBackground'
                                : 'transparent',
                    }}
                >
                    <Checkbox
                        checked={subtask.status === 'DONE'}
                        onChange={() => handleToggleStatus(subtask)}
                    />

                    <ListItemText
                        primary={
                            editingId === subtask.id ? (
                                <TextField
                                    value={editTitle}
                                    onChange={(e) =>
                                        setEditTitle(e.target.value)
                                    }
                                    onBlur={() => handleSaveEdit(subtask.id)}
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' &&
                                        handleSaveEdit(subtask.id)
                                    }
                                    size='small'
                                    autoFocus
                                />
                            ) : (
                                <Typography variant='body2'>
                                    {subtask.title}
                                </Typography>
                            )
                        }
                        secondary={
                            subtask.estimatedHours ? (
                                <Typography
                                    variant='caption'
                                    color='text.secondary'
                                >
                                    ⏱️ {subtask.estimatedHours} ч.
                                    {subtask.actualHours &&
                                        ` (факт: ${subtask.actualHours} ч.)`}
                                </Typography>
                            ) : null
                        }
                    />

                    <ListItemSecondaryAction>
                        {hasChildren && (
                            <IconButton
                                size='small'
                                onClick={() => toggleExpand(subtask.id)}
                            >
                                {isExpanded ? (
                                    <ExpandLessIcon />
                                ) : (
                                    <ExpandMoreIcon />
                                )}
                            </IconButton>
                        )}
                        <IconButton
                            size='small'
                            onClick={() => handleStartEdit(subtask)}
                        >
                            <EditIcon />
                        </IconButton>
                        <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDelete(subtask.id)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </ListItemSecondaryAction>
                </ListItem>

                {hasChildren && (
                    <Collapse
                        in={isExpanded}
                        timeout='auto'
                        unmountOnExit
                    >
                        <List
                            component='div'
                            disablePadding
                        >
                            {buildTree(subtask.id).map((child) =>
                                renderSubtask(child, level + 1),
                            )}
                            <ListItem sx={{ pl: (level + 1) * 3 }}>
                                <Button
                                    size='small'
                                    startIcon={<AddIcon />}
                                    onClick={() => onAddSubtask(subtask.id)}
                                >
                                    Добавить подзадачу
                                </Button>
                            </ListItem>
                        </List>
                    </Collapse>
                )}
            </Box>
        );
    };

    const rootSubtasks = buildTree(null);

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                }}
            >
                <Typography variant='h6'>📋 Подзадачи</Typography>
                <Button
                    size='small'
                    variant='outlined'
                    startIcon={<AddIcon />}
                    onClick={() => onAddSubtask(null)}
                >
                    Добавить корневую
                </Button>
            </Box>

            {rootSubtasks.length === 0 ? (
                <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ py: 2 }}
                >
                    Нет подзадач. Добавьте первую подзадачу для декомпозиции
                    задачи.
                </Typography>
            ) : (
                <List>
                    {rootSubtasks.map((subtask) => renderSubtask(subtask))}
                </List>
            )}
        </Box>
    );
}
