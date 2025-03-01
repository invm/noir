import { VsClose as X } from 'solid-icons/vs';
import { Badge } from 'components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from 'components/ui/popover';
import { cn } from 'utils/cn';
import { createSignal, For, Match, Switch } from 'solid-js';

type MultiSelectProps = {
  options: string[];
  selected: string[];
  onChange: (options: string[]) => void;
  placeholder?: string;
};

export function MultiSelect(props: MultiSelectProps) {
  const [open, setOpen] = createSignal(false);

  const handleUnselect = (option: string) => {
    props.onChange(props.selected.filter((s) => s !== option));
  };

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <PopoverTrigger as="div">
        <div
          role="combobox"
          aria-expanded={open()}
          class="flex min-h-[2.5rem] w-full flex-wrap items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Switch>
            <Match when={props.selected.length > 0}>
              <div class="flex flex-wrap gap-1">
                <For each={props.selected}>
                  {(option) => (
                    <Badge variant="secondary" class="mr-1 mb-1">
                      {option}
                      <button
                        class="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUnselect(option);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={() => handleUnselect(option)}
                      >
                        <X class="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  )}
                </For>
              </div>
            </Match>
            <Match when={props.selected.length <= 0}>
              <span class="text-muted-foreground">{props.placeholder}</span>
            </Match>
          </Switch>
        </div>
      </PopoverTrigger>
      <PopoverContent class="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              <For each={props.options}>
                {(option) => (
                  <CommandItem
                    onSelect={() => {
                      props.onChange(
                        props.selected.some((s) => s === option)
                          ? props.selected.filter((s) => s !== option)
                          : [...props.selected, option]
                      );
                      setOpen(true);
                    }}
                  >
                    <div
                      class={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        props.selected.some((s) => s === option)
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <X class="h-4 w-4" />
                    </div>
                    {option}
                  </CommandItem>
                )}
              </For>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
