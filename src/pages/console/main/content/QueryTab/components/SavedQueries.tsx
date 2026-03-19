import { createEffect, createSignal, For, Show } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { Button } from 'components/ui/button';
import { TextField, TextFieldRoot } from 'components/ui/textfield';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog';
import { toast } from 'solid-sonner';
import { VsChromeClose as Delete } from 'solid-icons/vs';

type SavedQuery = {
  id: string;
  name: string;
  query: string;
  created_at: number;
};

type SaveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onSaved: () => void;
};

export const SaveQueryDialog = (props: SaveDialogProps) => {
  const [name, setName] = createSignal('');
  const [saving, setSaving] = createSignal(false);

  const save = async () => {
    if (!name().trim()) return;
    setSaving(true);
    try {
      await invoke('save_query', { name: name().trim(), query: props.query });
      toast.success('Query saved');
      setName('');
      props.onOpenChange(false);
      props.onSaved();
    } catch (error) {
      toast.error('Could not save query', {
        description: (error as Error).message || (error as string),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save Query</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div class="flex flex-col gap-3">
            <TextFieldRoot>
              <TextField
                placeholder="Query name"
                value={name()}
                onInput={(e: InputEvent) =>
                  setName((e.target as HTMLInputElement).value)
                }
                autofocus
              />
            </TextFieldRoot>
            <div class="text-xs text-muted-foreground max-h-20 overflow-auto font-mono bg-muted p-2 rounded">
              {props.query.slice(0, 200)}
              {props.query.length > 200 ? '...' : ''}
            </div>
            <Button type="submit" disabled={saving() || !name().trim()}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

type ListDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (query: string) => void;
};

export const SavedQueriesDialog = (props: ListDialogProps) => {
  const [queries, setQueries] = createSignal<SavedQuery[]>([]);
  const [loading, setLoading] = createSignal(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await invoke<SavedQuery[]>('get_saved_queries');
      setQueries(result);
    } catch (error) {
      toast.error('Could not load saved queries');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await invoke('delete_saved_query', { id });
      setQueries(queries().filter((q) => q.id !== id));
      toast.success('Query deleted');
    } catch (error) {
      toast.error('Could not delete query');
    }
  };

  createEffect(() => {
    if (props.open) load();
  });

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-lg max-h-[70vh]">
        <DialogHeader>
          <DialogTitle>Saved Queries</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col gap-1 overflow-auto max-h-[50vh]">
          <Show when={!loading() && queries().length === 0}>
            <p class="text-sm text-muted-foreground text-center py-4">
              No saved queries yet
            </p>
          </Show>
          <For each={queries()}>
            {(q) => (
              <div class="flex items-center justify-between gap-2 p-2 rounded hover:bg-accent cursor-pointer group">
                <div
                  class="flex-1 min-w-0"
                  onClick={() => {
                    props.onSelect(q.query);
                    props.onOpenChange(false);
                  }}
                >
                  <div class="text-sm font-medium truncate">{q.name}</div>
                  <div class="text-xs text-muted-foreground font-mono truncate">
                    {q.query.slice(0, 80)}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  class="h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={(e: MouseEvent) => {
                    e.stopPropagation();
                    remove(q.id);
                  }}
                >
                  <Delete class="size-3" />
                </Button>
              </div>
            )}
          </For>
        </div>
      </DialogContent>
    </Dialog>
  );
};
