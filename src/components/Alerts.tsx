import { For } from "solid-js"
import { useAppSelector } from "../services/Context"

export const Alerts = () => {
  const { errorService: { errors } } = useAppSelector()
  return (
    <div class="absolute">
      <div class="toast">
        <For each={errors}>
          {error => (
            <div class="alert alert-error">
              <span>{error.message}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
