import { For } from "solid-js"
const tables = [
  { name: 'users', columns: ['id', 'name', 'email'] },
  { name: 'posts', columns: ['id', 'title', 'body', 'user_id'] },
  { name: 'comments', columns: ['id', 'body', 'post_id', 'user_id'] },
]

const functions = [
  { name: 'get_users', args: ['id'] },
  { name: 'get_posts', args: ['id'] },
  { name: 'get_comments', args: ['id'] },
]

const triggers = [
  { name: 'users', events: ['insert', 'update', 'delete'] },
  { name: 'posts', events: ['insert', 'update', 'delete'] },
  { name: 'comments', events: ['insert', 'update', 'delete'] },
]

export const Sidebar = () => {

  return (
    <div class="p-3 select-text">
      <div class="text-xs font-bold text-primary">Tables</div>
      <For each={tables}>
        {(table) => (
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full bg-primary-500"></div>
            <div>{table.name}</div>
          </div>
        )}
      </For>
      <div class="text-xs font-bold text-primary">Functions</div>
      <For each={functions}>
        {(func) => (
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full bg-primary-500"></div>
            <div>{func.name}</div>
          </div>
        )}
      </For>
      <div class="text-xs font-bold text-primary">Triggers</div>
      <For each={triggers}>
        {(trigger) => (
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full bg-primary-500"></div>
            <div>{trigger.name}</div>
          </div>
        )}
      </For>
    </div>
  )
}
