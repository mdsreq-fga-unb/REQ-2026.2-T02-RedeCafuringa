import { useEffect, useRef, useState, type ReactNode } from "react";

type CalendarMonth = { year: number; month: number };

function shiftCalendarMonth({ year, month }: CalendarMonth, amount: number) {
    const date = new Date(Date.UTC(year, month + amount, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

type DatePickerProps = {
    id: string;
    label: string;
    selectedDate: Date | null;
    minDate?: Date;
    maxDate?: Date;
    onSelect: (date: Date) => void;
    children: ReactNode;
};

export function DatePicker({
    id,
    label,
    selectedDate,
    minDate,
    maxDate,
    onSelect,
    children,
}: DatePickerProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const [visibleMonth, setVisibleMonth] = useState<CalendarMonth>(() => {
        const initialDate = selectedDate ?? minDate ?? maxDate ?? new Date();
        return {
            year: initialDate.getUTCFullYear(),
            month: initialDate.getUTCMonth(),
        };
    });
    const monthStart = new Date(
        Date.UTC(visibleMonth.year, visibleMonth.month, 1),
    );
    const daysInMonth = new Date(
        Date.UTC(visibleMonth.year, visibleMonth.month + 1, 0),
    ).getUTCDate();
    const leadingDays = (monthStart.getUTCDay() + 6) % 7;
    const monthName = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        timeZone: "UTC",
    })
        .format(monthStart)
        .replace(/^./, (character) => character.toLocaleUpperCase("pt-BR"));
    const firstYear = Math.min(
        minDate?.getUTCFullYear() ?? 1900,
        visibleMonth.year,
    );
    const lastYear = Math.max(
        maxDate?.getUTCFullYear() ?? visibleMonth.year + 10,
        visibleMonth.year,
    );
    const nextMonth = new Date(
        Date.UTC(visibleMonth.year, visibleMonth.month + 1, 1),
    );

    const closeCalendar = () => {
        setIsCalendarOpen(false);
        triggerRef.current?.focus();
    };

    // Ao abrir, o foco entra no calendário; clicar fora o fecha.
    useEffect(() => {
        if (!isCalendarOpen) return;
        dialogRef.current?.focus();
        const closeOnOutsidePress = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsCalendarOpen(false);
            }
        };
        document.addEventListener("mousedown", closeOnOutsidePress);
        return () =>
            document.removeEventListener("mousedown", closeOnOutsidePress);
    }, [isCalendarOpen]);

    const selectDay = (day: number) => {
        const date = new Date(
            Date.UTC(visibleMonth.year, visibleMonth.month, day),
        );
        onSelect(date);
        closeCalendar();
    };

    const calendarCells = Array.from(
        { length: leadingDays + daysInMonth },
        (_, index) => {
            if (index < leadingDays) return null;
            return index - leadingDays + 1;
        },
    );

    return (
        <div className="birth-date-control" ref={containerRef}>
            {children}
            <button
                ref={triggerRef}
                className="birth-calendar-trigger"
                type="button"
                aria-label="Abrir calendário"
                aria-haspopup="dialog"
                aria-expanded={isCalendarOpen}
                aria-controls={isCalendarOpen ? id : undefined}
                title="Abrir calendário"
                onClick={() => {
                    const selected = selectedDate;
                    if (selected) {
                        setVisibleMonth({
                            year: selected.getUTCFullYear(),
                            month: selected.getUTCMonth(),
                        });
                    }
                    setIsCalendarOpen((open) => !open);
                }}
            >
                <CalendarIcon />
            </button>
            {isCalendarOpen && (
                <div
                    className="birth-calendar"
                    id={id}
                    ref={dialogRef}
                    tabIndex={-1}
                    role="dialog"
                    aria-label={label}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") closeCalendar();
                    }}
                >
                    <div className="birth-calendar-header">
                        <button
                            className="birth-calendar-nav"
                            type="button"
                            aria-label="Mês anterior"
                            disabled={Boolean(minDate && monthStart <= minDate)}
                            onClick={() =>
                                setVisibleMonth((month) =>
                                    shiftCalendarMonth(month, -1),
                                )
                            }
                        >
                            <span aria-hidden="true">‹</span>
                        </button>
                        <strong>{monthName}</strong>
                        <select
                            className="birth-calendar-year"
                            aria-label="Ano"
                            value={visibleMonth.year}
                            onChange={(event) =>
                                setVisibleMonth((month) => ({
                                    ...month,
                                    year: Number(event.target.value),
                                }))
                            }
                        >
                            {Array.from(
                                { length: lastYear - firstYear + 1 },
                                (_, index) => lastYear - index,
                            ).map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                        <button
                            className="birth-calendar-nav"
                            type="button"
                            aria-label="Próximo mês"
                            disabled={Boolean(maxDate && nextMonth > maxDate)}
                            onClick={() =>
                                setVisibleMonth((month) =>
                                    shiftCalendarMonth(month, 1),
                                )
                            }
                        >
                            <span aria-hidden="true">›</span>
                        </button>
                    </div>
                    <div className="birth-calendar-weekdays" aria-hidden="true">
                        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(
                            (weekday) => (
                                <span key={weekday}>{weekday}</span>
                            ),
                        )}
                    </div>
                    <div
                        className="birth-calendar-days"
                        role="group"
                        aria-label="Dias do mês"
                    >
                        {calendarCells.map((day, index) => {
                            if (day === null) {
                                return (
                                    <span
                                        className="birth-calendar-empty"
                                        key={`empty-${index}`}
                                        aria-hidden="true"
                                    />
                                );
                            }

                            const date = new Date(
                                Date.UTC(
                                    visibleMonth.year,
                                    visibleMonth.month,
                                    day,
                                ),
                            );
                            const outsideRange = Boolean(
                                (minDate && date < minDate) ||
                                (maxDate && date > maxDate),
                            );
                            const isSelected =
                                selectedDate?.getUTCFullYear() ===
                                    visibleMonth.year &&
                                selectedDate.getUTCMonth() ===
                                    visibleMonth.month &&
                                selectedDate.getUTCDate() === day;

                            return (
                                <button
                                    className="birth-calendar-day"
                                    key={day}
                                    type="button"
                                    aria-label={`${day} de ${monthName} de ${visibleMonth.year}`}
                                    aria-pressed={isSelected}
                                    disabled={outsideRange}
                                    onClick={() => selectDay(day)}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function CalendarIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="16" rx="2" />
            <path d="M7.5 3v4M16.5 3v4M3.5 9h17" />
        </svg>
    );
}
