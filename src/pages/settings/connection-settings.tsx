export function ConnectionSettings() {
  return (
    <div class="h-full">
      <h2 class="text-2xl font-bold mb-4 text-foreground">
        Connection Settings
      </h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">
            Default Database
          </label>
          <select class="w-full p-2 bg-input border border-input rounded text-foreground">
            <option>MySQL</option>
            <option>PostgreSQL</option>
            <option>SQLite</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">
            Connection Timeout (seconds)
          </label>
          <input
            type="number"
            class="w-full p-2 bg-input border border-input rounded text-foreground"
            min="1"
            max="60"
          />
        </div>
        <div>
          <label class="flex items-center space-x-2">
            <input type="checkbox" class="form-checkbox" />
            <span class="text-sm text-foreground">Auto-connect on startup</span>
          </label>
        </div>
      </div>
    </div>
  );
}
