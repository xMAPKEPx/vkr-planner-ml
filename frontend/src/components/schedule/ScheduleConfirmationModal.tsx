'use client';

import { useState } from 'react';
import {
    X,
    CheckCircle,
    AlertCircle,
    Clock,
    Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface ScheduleVariant {
    id: string;
    name: string;
    description: string;
    slots: Array<{
        date: string;
        startTime: string;
        endTime: string;
        taskTitle: string;
        estimatedHours: number;
    }>;
    metrics: {
        totalDays: number;
        avgLoadPerDay: number;
        riskScore: number;
        completionDate: string;
    };
    confidence: number;
}

interface ScheduleConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    variants: ScheduleVariant[];
    recommendedVariantId: string;
    onConfirm: (variantId: string) => Promise<void>;
    isLoading?: boolean;
}

export default function ScheduleConfirmationModal({
    isOpen,
    onClose,
    variants,
    recommendedVariantId,
    onConfirm,
}: ScheduleConfirmationModalProps) {
    const [selectedVariantId, setSelectedVariantId] = useState(
        recommendedVariantId,
    );
    const [isConfirming, setIsConfirming] = useState(false);

    const selectedVariant = variants.find((v) => v.id === selectedVariantId);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm(selectedVariantId);
            onClose();
        } finally {
            setIsConfirming(false);
        }
    };

    const getRiskBadgeColor = (risk: number) => {
        if (risk < 0.3) return 'bg-green-100 text-green-800';
        if (risk < 0.6) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getLoadColor = (load: number) => {
        if (load < 2) return 'text-blue-600';
        if (load < 4) return 'text-green-600';
        return 'text-orange-600';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='max-w-4xl max-h-96-vh overflow-hidden flex flex-col'>
                <DialogHeader className='border-b border-gray-200 dark:border-gray-800'>
                    <DialogTitle className='flex items-center gap-2'>
                        <CheckCircle className='w-5 h-5 text-blue-600' />
                        Выберите оптимальный вариант расписания
                    </DialogTitle>
                </DialogHeader>

                <div className='flex-1 overflow-y-auto'>
                    {variants.length === 0 ? (
                        <div className='p-6 text-center text-gray-500'>
                            <AlertCircle className='w-8 h-8 mx-auto mb-2 text-yellow-600' />
                            <p>Не удалось сгенерировать варианты расписания</p>
                        </div>
                    ) : (
                        <Tabs
                            value={selectedVariantId}
                            onValueChange={setSelectedVariantId}
                            className='p-4'
                        >
                            <TabsList className='grid w-full grid-cols-3 mb-4'>
                                {variants.map((variant) => (
                                    <TabsTrigger
                                        key={variant.id}
                                        value={variant.id}
                                        className='text-xs sm:text-sm'
                                    >
                                        {variant.name}
                                        {variant.id === recommendedVariantId && (
                                            <Badge className='ml-1 bg-green-600'>
                                                Рекомендуемо
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {variants.map((variant) => (
                                <TabsContent
                                    key={variant.id}
                                    value={variant.id}
                                    className='space-y-4'
                                >
                                    {/* Описание варианта */}
                                    <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                                        <p className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                                            {variant.description}
                                        </p>
                                    </div>

                                    {/* Метрики */}
                                    <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                                        <div className='p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700'>
                                            <div className='text-xs text-gray-500'>
                                                Дней
                                            </div>
                                            <div className='text-lg font-bold'>
                                                {variant.metrics.totalDays}
                                            </div>
                                        </div>
                                        <div className='p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700'>
                                            <div className='text-xs text-gray-500'>
                                                Ч/день
                                            </div>
                                            <div
                                                className={`text-lg font-bold ${getLoadColor(variant.metrics.avgLoadPerDay)}`}
                                            >
                                                {variant.metrics.avgLoadPerDay.toFixed(
                                                    1,
                                                )}
                                            </div>
                                        </div>
                                        <div className='p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700'>
                                            <div className='text-xs text-gray-500'>
                                                Риск
                                            </div>
                                            <div
                                                className={`text-lg font-bold px-2 py-1 rounded ${getRiskBadgeColor(variant.metrics.riskScore)}`}
                                            >
                                                {(
                                                    variant.metrics.riskScore * 100
                                                ).toFixed(0)}%
                                            </div>
                                        </div>
                                        <div className='p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700'>
                                            <div className='text-xs text-gray-500'>
                                                Конфиденс
                                            </div>
                                            <div className='text-lg font-bold text-green-600'>
                                                {(variant.confidence * 100).toFixed(
                                                    0,
                                                )}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Расписание слотов */}
                                    <div className='space-y-2 max-h-48 overflow-y-auto'>
                                        <h4 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                                            Расписание подзадач:
                                        </h4>
                                        {variant.slots.map((slot, idx) => (
                                            <div
                                                key={idx}
                                                className='flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-sm'
                                            >
                                                <div className='flex items-center gap-1 text-gray-500 text-xs min-w-fit'>
                                                    <Calendar className='w-3 h-3' />
                                                    {new Date(
                                                        slot.date,
                                                    ).toLocaleDateString(
                                                        'ru-RU',
                                                        {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        },
                                                    )}
                                                </div>
                                                <div className='flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs'>
                                                    <Clock className='w-3 h-3' />
                                                    {slot.startTime} - {slot.endTime}
                                                </div>
                                                <div className='flex-1 truncate text-gray-700 dark:text-gray-300'>
                                                    {slot.taskTitle}
                                                </div>
                                                <div className='text-gray-500 text-xs'>
                                                    {slot.estimatedHours.toFixed(
                                                        2,
                                                    )}ч
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    )}
                </div>

                {/* Кнопки действия */}
                <div className='flex gap-3 justify-end p-4 border-t border-gray-200 dark:border-gray-800'>
                    <Button
                        variant='outline'
                        onClick={onClose}
                        disabled={isConfirming}
                    >
                        <X className='w-4 h-4 mr-2' />
                        Отменить
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isConfirming || !selectedVariant}
                        className='bg-green-600 hover:bg-green-700'
                    >
                        {isConfirming ? (
                            <>
                                <span className='animate-spin mr-2'>⏳</span>
                                Сохранение...
                            </>
                        ) : (
                            <>
                                <CheckCircle className='w-4 h-4 mr-2' />
                                Сохранить расписание
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
