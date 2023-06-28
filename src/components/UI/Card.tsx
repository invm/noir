import { UIProps } from './types'

const Card = ({ children, style = {} }: UIProps) => {
  return (
    <div class="block p-3 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" {...{ style }}>
      {children}
    </div>
  )
}

export { Card }

