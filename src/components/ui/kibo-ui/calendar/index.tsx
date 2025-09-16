"use client";

import { getDay, getDaysInMonth, isSameDay } from "date-fns";
import { atom, useAtom } from "jotai";
import {
  Check,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDown,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CalendarState = {
  month: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  year: number;
};

const monthAtom = atom<CalendarState["month"]>(
  new Date().getMonth() as CalendarState["month"]
);
const yearAtom = atom<CalendarState["year"]>(new Date().getFullYear());

export const useCalendarMonth = () => useAtom(monthAtom);
export const useCalendarYear = () => useAtom(yearAtom);

type CalendarContextProps = {
  locale: Intl.LocalesArgument;
  startDay: number;
  ideaId?: string;
};

const CalendarContext = createContext<CalendarContextProps>({
  locale: "en-US",
  startDay: 0,
  ideaId: undefined,
});

export type Status = {
  id: string;
  name: string;
  color: string;
};

export type Feature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: Status;
};

export type Task = {
  _id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  assignedTo?: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  deadline?: number;
  completionTarget?: string;
  author: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  canEdit: boolean;
  canDelete: boolean;
};

type ComboboxProps = {
  value: string;
  setValue: (value: string) => void;
  data: {
    value: string;
    label: string;
  }[];
  labels: {
    button: string;
    empty: string;
    search: string;
  };
  className?: string;
};

export const monthsForLocale = (
  localeName: Intl.LocalesArgument,
  monthFormat: Intl.DateTimeFormatOptions["month"] = "long"
) => {
  const format = new Intl.DateTimeFormat(localeName, { month: monthFormat })
    .format;

  return [...new Array(12).keys()].map((m) =>
    format(new Date(Date.UTC(2021, m, 2)))
  );
};

export const daysForLocale = (
  locale: Intl.LocalesArgument,
  startDay: number
) => {
  const weekdays: string[] = [];
  const baseDate = new Date(2024, 0, startDay);

  for (let i = 0; i < 7; i++) {
    weekdays.push(
      new Intl.DateTimeFormat(locale, { weekday: "short" }).format(baseDate)
    );
    baseDate.setDate(baseDate.getDate() + 1);
  }

  return weekdays;
};

const Combobox = ({
  value,
  setValue,
  data,
  labels,
  className,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn("w-40 justify-between capitalize", className)}
          variant="outline"
        >
          {value
            ? data.find((item) => item.value === value)?.label
            : labels.button}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0">
        <Command
          filter={(value, search) => {
            const label = data.find((item) => item.value === value)?.label;

            return label?.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={labels.search} />
          <CommandList>
            <CommandEmpty>{labels.empty}</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  className="capitalize"
                  key={item.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  value={item.value}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

type OutOfBoundsDayProps = {
  day: number;
};

const OutOfBoundsDay = ({ day }: OutOfBoundsDayProps) => (
  <div className="relative h-full w-full bg-secondary p-1 text-muted-foreground text-xs">
    {day}
  </div>
);

export type CalendarBodyProps = {
  features?: Feature[];
  tasks?: Task[];
  children: (props: { feature: Feature; task?: Task; onEdit?: (task: Task) => void }) => ReactNode;
};

export const CalendarBody = ({ features: legacyFeatures, tasks, children }: CalendarBodyProps) => {
  const [month] = useCalendarMonth();
  const [year] = useCalendarYear();
  const { startDay, ideaId } = useContext(CalendarContext);

  // Check for deadline notifications when calendar loads
  const checkDeadlinesAndNotify = useMutation(api.todos.checkDeadlinesAndNotify);

  useEffect(() => {
    checkDeadlinesAndNotify();
  }, [checkDeadlinesAndNotify]);

  // Fetch tasks if ideaId is provided
  const fetchedTasks = useQuery(api.todos.getTodosForIdea, ideaId ? { ideaId: ideaId as Id<"ideas"> } : 'skip') as Task[] || [];

  const allTasks = (tasks || fetchedTasks) as Task[];

  // Map tasks to features
  const mappedFeatures = useMemo(() => {
    return allTasks.map((task: Task): Feature => {
      let color = 'gray';
      if (task.status === 'done') color = 'green';
      else if (task.status === 'in_progress') color = 'blue';
      else if (task.deadline && task.deadline < Date.now()) color = 'red';
      else color = 'yellow';

      return {
        id: task._id,
        name: task.title,
        startAt: new Date(), // Not used for tasks
        endAt: task.deadline ? new Date(task.deadline) : new Date(),
        status: {
          id: task.status,
          name: task.status.replace('_', ' '),
          color,
        },
      };
    });
  }, [allTasks]);

  const effectiveFeatures = legacyFeatures || mappedFeatures;

  // Memoize expensive date calculations
  const currentMonthDate = useMemo(
    () => new Date(year, month, 1),
    [year, month]
  );
  const daysInMonth = useMemo(
    () => getDaysInMonth(currentMonthDate),
    [currentMonthDate]
  );
  const firstDay = useMemo(
    () => (getDay(currentMonthDate) - startDay + 7) % 7,
    [currentMonthDate, startDay]
  );

  // Memoize previous month calculations
  const prevMonthData = useMemo(() => {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthDays = getDaysInMonth(new Date(prevMonthYear, prevMonth, 1));
    const prevMonthDaysArray = Array.from(
      { length: prevMonthDays },
      (_, i) => i + 1
    );
    return { prevMonthDays, prevMonthDaysArray };
  }, [month, year]);

  // Memoize next month calculations
  const nextMonthData = useMemo(() => {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonthDays = getDaysInMonth(new Date(nextMonthYear, nextMonth, 1));
    const nextMonthDaysArray = Array.from(
      { length: nextMonthDays },
      (_, i) => i + 1
    );
    return { nextMonthDaysArray };
  }, [month, year]);

  // Memoize features filtering by day to avoid recalculating on every render
  const featuresByDay = useMemo(() => {
    const result: { [day: number]: Feature[] } = {};
    for (let day = 1; day <= daysInMonth; day++) {
      result[day] = effectiveFeatures.filter((feature) => {
        return isSameDay(new Date(feature.endAt), new Date(year, month, day));
      });
    }
    return result;
  }, [effectiveFeatures, daysInMonth, year, month]);

  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  const days: ReactNode[] = [];

  const createTodo = useMutation(api.todos.createTodo);
  const updateTodo = useMutation(api.todos.updateTodo);

  const handleDayClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth || !ideaId) return;
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
    setIsCreateDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleCreateTask = async (data: { title: string; assignedTo?: string; deadline?: number; completionTarget?: string }) => {
    if (!ideaId) return;
    try {
      await createTodo({
        ideaId: ideaId as Id<"ideas">,
        title: data.title,
        assignedTo: data.assignedTo as Id<"users"> | undefined,
        deadline: data.deadline,
        completionTarget: data.completionTarget,
      });
      toast({
        title: "Task created",
        description: "Task has been successfully created.",
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create task:", error);
      toast({
        title: "Creation failed",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (updates: { assignedTo?: string; deadline?: number; completionTarget?: string }) => {
    if (!editingTask) return;
    try {
      await updateTodo({
        todoId: editingTask._id as Id<"todos">,
        assignedTo: updates.assignedTo as Id<"users"> | undefined,
        deadline: updates.deadline,
        completionTarget: updates.completionTarget,
      });
      toast({
        title: "Task updated",
        description: "Task details have been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setEditingTask(undefined);
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Update failed",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  for (let i = 0; i < firstDay; i++) {
    const day =
      prevMonthData.prevMonthDaysArray[
        prevMonthData.prevMonthDays - firstDay + i
      ];

    if (day) {
      days.push(<OutOfBoundsDay day={day} key={`prev-${i}`} />);
    }
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const featuresForDay = featuresByDay[day] || [];

    days.push(
      <div
        className={cn(
          "relative flex h-full w-full flex-col gap-1 p-1 text-muted-foreground text-xs cursor-pointer hover:bg-accent/50",
          ideaId && "hover:bg-blue-50"
        )}
        key={day}
        onClick={() => handleDayClick(day, true)}
      >
        {day}
        <div>
          {featuresForDay.slice(0, 3).map((feature) => {
            const correspondingTask = allTasks.find(t => t._id === feature.id);
            return children({ feature, task: correspondingTask, onEdit: handleEditTask });
          })}
        </div>
        {featuresForDay.length > 3 && (
          <span className="block text-muted-foreground text-xs">
            +{featuresForDay.length - 3} more
          </span>
        )}
      </div>
    );
  }

  const remainingDays = 7 - ((firstDay + daysInMonth) % 7);
  if (remainingDays < 7) {
    for (let i = 0; i < remainingDays; i++) {
      const day = nextMonthData.nextMonthDaysArray[i];

      if (day) {
        days.push(<OutOfBoundsDay day={day} key={`next-${i}`} />);
      }
    }
  }

  return (
    <>
      <div className="grid flex-grow grid-cols-7">
        {days.map((day, index) => (
          <div
            className={cn(
              "relative aspect-square overflow-hidden border-t border-r",
              index % 7 === 6 && "border-r-0"
            )}
            key={index}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Task Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <TaskCreateDialog
          selectedDate={selectedDate}
          onClose={() => setIsCreateDialogOpen(false)}
          onSave={handleCreateTask}
        />
      </Dialog>

      {/* Task Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <TaskEditDialog
          task={editingTask}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingTask(undefined);
          }}
          onSave={handleUpdateTask}
        />
      </Dialog>
    </>
  );
};

// Task Create Dialog Component
type TaskCreateDialogProps = {
  selectedDate?: Date;
  onClose: () => void;
  onSave: (data: { title: string; assignedTo?: string; deadline?: number; completionTarget?: string }) => void;
};

function TaskCreateDialog({ selectedDate, onClose, onSave }: TaskCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(selectedDate);
  const [completionTarget, setCompletionTarget] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users for assignee dropdown
  const users: { _id: string; displayName: string }[] = useQuery(api.users.getAllUsers) || [];

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsLoading(true);
    try {
      await onSave({
        title: title.trim(),
        assignedTo: assignedTo || undefined,
        deadline: deadline?.getTime(),
        completionTarget: completionTarget.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create New Task</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="title" className="text-right">
            Title
          </Label>
          <Input
            id="title"
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="assignee" className="text-right">
            Assignee
          </Label>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select assignee..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="deadline" className="text-right">
            Deadline
          </Label>
          <Input
            id="deadline"
            type="datetime-local"
            value={deadline ? format(deadline, "yyyy-MM-dd'T'HH:mm") : ""}
            onChange={(e) => setDeadline(e.target.value ? new Date(e.target.value) : undefined)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="completionTarget" className="text-right">
            Target
          </Label>
          <Textarea
            id="completionTarget"
            placeholder="What needs to be completed..."
            value={completionTarget}
            onChange={(e) => setCompletionTarget(e.target.value)}
            className="col-span-3"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading || !title.trim()}>
          {isLoading ? "Creating..." : "Create"}
        </Button>
      </div>
    </DialogContent>
  );
}

// Task Edit Dialog Component (adapted from kanban)
type TaskEditDialogProps = {
  task?: Task;
  onClose: () => void;
  onSave: (updates: { assignedTo?: string; deadline?: number; completionTarget?: string }) => void;
};

function TaskEditDialog({ task, onClose, onSave }: TaskEditDialogProps) {
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo?._id || "");
  const [deadline, setDeadline] = useState<Date | undefined>(task?.deadline ? new Date(task.deadline) : undefined);
  const [completionTarget, setCompletionTarget] = useState(task?.completionTarget || "");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users for assignee dropdown
  const users: { _id: string; displayName: string }[] = useQuery(api.users.getAllUsers) || [];

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({
        assignedTo: assignedTo || undefined,
        deadline: deadline?.getTime(),
        completionTarget: completionTarget || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save task updates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!task) return null;

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Task: {task.title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="assignee" className="text-right">
            Assignee
          </Label>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select assignee..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="deadline" className="text-right">
            Deadline
          </Label>
          <Input
            id="deadline"
            type="datetime-local"
            value={deadline ? format(deadline, "yyyy-MM-dd'T'HH:mm") : ""}
            onChange={(e) => setDeadline(e.target.value ? new Date(e.target.value) : undefined)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="completionTarget" className="text-right">
            Target
          </Label>
          <Textarea
            id="completionTarget"
            placeholder="What needs to be completed..."
            value={completionTarget}
            onChange={(e) => setCompletionTarget(e.target.value)}
            className="col-span-3"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </DialogContent>
  );
}

export type CalendarDatePickerProps = {
  className?: string;
  children: ReactNode;
};

export const CalendarDatePicker = ({
  className,
  children,
}: CalendarDatePickerProps) => (
  <div className={cn("flex items-center gap-1", className)}>{children}</div>
);

export type CalendarMonthPickerProps = {
  className?: string;
};

export const CalendarMonthPicker = ({
  className,
}: CalendarMonthPickerProps) => {
  const [month, setMonth] = useCalendarMonth();
  const { locale } = useContext(CalendarContext);

  // Memoize month data to avoid recalculating date formatting
  const monthData = useMemo(() => {
    return monthsForLocale(locale).map((month, index) => ({
      value: index.toString(),
      label: month,
    }));
  }, [locale]);

  return (
    <Combobox
      className={className}
      data={monthData}
      labels={{
        button: "Select month",
        empty: "No month found",
        search: "Search month",
      }}
      setValue={(value) =>
        setMonth(Number.parseInt(value) as CalendarState["month"])
      }
      value={month.toString()}
    />
  );
};

export type CalendarYearPickerProps = {
  className?: string;
  start: number;
  end: number;
};

export const CalendarYearPicker = ({
  className,
  start,
  end,
}: CalendarYearPickerProps) => {
  const [year, setYear] = useCalendarYear();

  return (
    <Combobox
      className={className}
      data={Array.from({ length: end - start + 1 }, (_, i) => ({
        value: (start + i).toString(),
        label: (start + i).toString(),
      }))}
      labels={{
        button: "Select year",
        empty: "No year found",
        search: "Search year",
      }}
      setValue={(value) => setYear(Number.parseInt(value))}
      value={year.toString()}
    />
  );
};

export type CalendarDatePaginationProps = {
  className?: string;
};

export const CalendarDatePagination = ({
  className,
}: CalendarDatePaginationProps) => {
  const [month, setMonth] = useCalendarMonth();
  const [year, setYear] = useCalendarYear();

  const handlePreviousMonth = useCallback(() => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth((month - 1) as CalendarState["month"]);
    }
  }, [month, year, setMonth, setYear]);

  const handleNextMonth = useCallback(() => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth((month + 1) as CalendarState["month"]);
    }
  }, [month, year, setMonth, setYear]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button onClick={handlePreviousMonth} size="icon" variant="ghost">
        <ChevronLeftIcon size={16} />
      </Button>
      <Button onClick={handleNextMonth} size="icon" variant="ghost">
        <ChevronRightIcon size={16} />
      </Button>
    </div>
  );
};

export type CalendarDateProps = {
  children: ReactNode;
};

export const CalendarDate = ({ children }: CalendarDateProps) => (
  <div className="flex items-center justify-between p-3">{children}</div>
);

export type CalendarHeaderProps = {
  className?: string;
};

export const CalendarHeader = ({ className }: CalendarHeaderProps) => {
  const { locale, startDay } = useContext(CalendarContext);

  // Memoize days data to avoid recalculating date formatting
  const daysData = useMemo(() => {
    return daysForLocale(locale, startDay);
  }, [locale, startDay]);

  return (
    <div className={cn("grid flex-grow grid-cols-7", className)}>
      {daysData.map((day) => (
        <div className="p-3 text-right text-muted-foreground text-xs" key={day}>
          {day}
        </div>
      ))}
    </div>
  );
};

export type CalendarItemProps = {
  feature: Feature;
  task?: Task;
  className?: string;
  onEdit?: (task: Task) => void;
};

export const CalendarItem = memo(
  ({ feature, task, className, onEdit }: CalendarItemProps) => (
    <div
      className={cn("flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1 rounded", className)}
      onClick={(e) => {
        e.stopPropagation();
        if (task && onEdit) onEdit(task);
      }}
    >
      <div
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: feature.status.color,
        }}
      />
      <span className="truncate text-xs">
        {feature.name}
        {task?.assignedTo && (
          <span className="ml-1 text-muted-foreground">
            ({task.assignedTo.name})
          </span>
        )}
      </span>
      {task?.completionTarget && (
        <span className="truncate text-xs text-muted-foreground ml-1">
          - {task.completionTarget}
        </span>
      )}
    </div>
  )
);

CalendarItem.displayName = "CalendarItem";

export type CalendarProviderProps = {
  locale?: Intl.LocalesArgument;
  startDay?: number;
  ideaId?: string;
  children: ReactNode;
  className?: string;
};

export const CalendarProvider = ({
  locale = "en-US",
  startDay = 0,
  ideaId,
  children,
  className,
}: CalendarProviderProps) => (
  <CalendarContext.Provider value={{ locale, startDay, ideaId }}>
    <div className={cn("relative flex flex-col", className)}>{children}</div>
  </CalendarContext.Provider>
);
