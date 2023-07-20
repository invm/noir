import { useAppSelector } from "services/Context"
import { createEffect, For } from "solid-js"

const rows = [
  { id: 1, name: 'Snow', calories: 159, fat: 6.0, carbs: 24, protein: 4.0 },
  { id: 2, name: 'Lannister', calories: 237, fat: 9.0, carbs: 37, protein: 4.3 },
  { id: 3, name: 'Lannister', calories: 262, fat: 16.0, carbs: 24, protein: 6.0 },
  { id: 4, name: 'Stark', calories: 305, fat: 3.7, carbs: 67, protein: 4.3 },
  { id: 5, name: 'Targaryen', calories: 356, fat: 16.0, carbs: 49, protein: 3.9 },
  { id: 6, name: 'Melisandre', calories: 159, fat: 6.0, carbs: 24, protein: 4.0 },
  { id: 7, name: 'Clifford', calories: 237, fat: 9.0, carbs: 37, protein: 4.3 },
  { id: 8, name: 'Frances', calories: 262, fat: 16.0, carbs: 24, protein: 6.0 },
  { id: 9, name: 'Roxie', calories: 305, fat: 3.7, carbs: 67, protein: 4.3 },
  { id: 10, name: 'Snow', calories: 159, fat: 6.0, carbs: 24, protein: 4.0 },
  { id: 11, name: 'Lannister', calories: 237, fat: 9.0, carbs: 37, protein: 4.3 },
]
export const ResultsArea = () => {
  const { connectionsService: { getActiveContentTab } } = useAppSelector()
  createEffect(() => {
    console.log(getActiveContentTab().data)
  })
  return (
    <div class="p-3">
      <div class="text-xs font-bold text-primary">Results</div>
      <div class="overflow-x-auto">
        <For each={rows}>
          {(row) => (
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full bg-primary"></div>
              <div>{row.name}</div>
            </div>
          )}
        </For>
      </div>
    </div>

  )
}
