import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { ScheduleSlot } from '@/types/schedule';

interface Props {
  slots: ScheduleSlot[];
}

export const ScheduleTimeline: React.FC<Props> = ({ slots }) => {
  // Группировка слотов по датам
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = slot.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, ScheduleSlot[]>);

  const dates = Object.keys(slotsByDate).sort();

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>📅 Дата</TableCell>
            <TableCell>⏰ Время</TableCell>
            <TableCell>📝 Задача</TableCell>
            <TableCell>⏱️ Длительность</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dates.map((date) => (
            <React.Fragment key={date}>
              {slotsByDate[date].map((slot, index) => (
                <TableRow
                  key={`${slot.date}-${slot.taskId}-${index}`}
                  hover
                  sx={{
                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                  }}
                >
                  <TableCell>
                    {index === 0 && (
                      <Chip
                        label={new Date(date).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          weekday: 'short',
                        })}
                        color="primary"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {slot.startTime} - {slot.endTime}
                  </TableCell>
                  <TableCell>{slot.taskTitle}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${slot.estimatedHours}ч`}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};