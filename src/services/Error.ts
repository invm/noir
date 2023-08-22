import { createStore } from "solid-js/store"
import { randomId } from "utils/utils";

type Error = {
  message: string;
  id: string;
}

const errorStore = createStore<Error[]>([]);

export const ErrorService = () => {
  const [errors, setErrors] = errorStore

  const addError = (error: string | unknown) => {
    const id = randomId()
    setErrors(errors.concat({ message: String(error), id }))

    setTimeout(() => {
      setErrors(errors.filter(e => e.id !== id))
    }, 5000)
  }

  return { errors, addError }
}
