export const QueryTextArea = (props: { query: string, updateQueryText: (s: string) => void }) => {
  return (
    <div class="flex-1">
      <textarea
        onInput={e => props.updateQueryText(e.currentTarget.value)}
        class="text-lg focus:outline-none textarea textarea-ghost w-full h-full resize-none border-none" value={props.query}></textarea>
    </div>
  )
}
