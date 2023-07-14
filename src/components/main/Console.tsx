import Split from 'split.js'
import { createEffect, onCleanup } from "solid-js"
import { ConnectionConfig, DbSchema } from '../../interfaces'
import { Sidebar } from '../Connections/Console/Sidebar'
import Content from '../Connections/Console/Content'

export const Console = (props: { schema: DbSchema, connection: ConnectionConfig }) => {
  createEffect(() => {
    const s = Split(['#sidebar', '#main'], {
      sizes: [20, 80],
      minSize: [100, 200],
      maxSize: [400, Infinity],
      gutterSize: 12,
    })
    onCleanup(() => {
      s.destroy()
    })
  })

  return (
    <div class="w-full h-full bg-base-300">
      <div class="flex w-full h-full">
        <div id="sidebar" class="h-full">
          <div class="bg-base-100 w-full h-full rounded-tr-lg">
            <Sidebar schema={props.schema} />
          </div>
        </div>
        <div id="main">
          <Content connection={props.connection} />
        </div>
      </div>
    </div>
  )
}

