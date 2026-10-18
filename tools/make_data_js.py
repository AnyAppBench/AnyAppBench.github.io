"""Write static/js/data.js from the parsed paper tables (arXiv:2609.34139)."""
import json, sys
d = json.load(open(sys.argv[1]))

# Full app names in the order of each appendix table header; AW-original apps first.
APPS = {
  "tasks": ["Tasks.org", "Cfait", "Todo List (PFA)", "ntodotxt", "TaskMate", "Grit"],
  "notes": ["Joplin", "Markor", "NotallyX", "neutriNote CE", "Notesnook", "Orgzly Revived"],
  "finance": ["Pro Expense", "Oinkoin", "OpenMoneyBox", "My Expenses", "Finance Manager", "Sushi"],
  "music": ["Retro Music", "Fossify Music Player", "Apollo", "SicMu Neo", "Phonograph Plus", "MonsterMusic"],
  "calendar": ["Simple Calendar Pro", "Etar", "Fossify Calendar", "Calendar", "KashCal"],
  "sms": ["Simple SMS Messenger", "Fossify Messages", "QUIK SMS", "Messages"],
  "file_manager": ["Material Files", "Amaze File Manager", "Fossify File Manager", "Total Commander", "X-plore File Manager"],
  "maps": ["OsmAnd~", "Organic Maps", "CoMaps"],
  "contacts": ["Google Contacts", "Fossify Contacts", "Connect You", "Simple Contacts Pro SE", "Right Contact"],
  "clock": ["Google Clock", "Clock", "Simple Clock", "Clock You", "Chrono", "Fossify Clock"],
}
# (AW-derived templates, new templates), from the paper's task inventory table.
TEMPLATES = {
  "tasks": (["CompletedTasksForDate","DueNextWeek","DueOnDate","HighPriorityTasks","HighPriorityDueOnDate","IncompleteTasksOnDate"],
            ["DueWithTime","Recurring","EditTask","CompleteTask"]),
  "notes": (["CreateNote","EditNote","MergeNotes","DeleteNote","SearchNote","ShareOrImportNote","FolderOrMoveNote","AttachOrTranscribeContent","CountTodoItems"],
            ["CreateChecklist"]),
  "finance": (["AddExpense","AddMultipleExpenses","DeleteTransaction","DeleteDuplicateTransactions","AttachReceipt"],
              ["AddIncome","EditTransaction","CategorySummary","DateRangeTotal","TransferBetweenWallets"]),
  "music": (["CreatePlaylist","AddToPlaylist","AddToQueue","SaveOrExportPlaylist","PlaylistDuration"],
            ["RenamePlaylist","RemoveFromPlaylist","ReorderQueue","SleepTimer","SearchAndPlay"]),
  "calendar": (["AddOneEvent","AddTimedEvent","AddRepeatingEvent","DeleteEvent","EventsOnDate","NextEvent","EventsInRange"],
               ["EditEvent","AddReminder","MoveEvent"]),
  "sms": (["Send","Reply","ReplyMostRecent","Resend","SendClipboard","SendReceivedAddress"],
          ["CreateDraftMessage","EditDraftMessage","DeleteConversation","ForwardMessage"]),
  "file_manager": (["DeleteFile","MoveFile"],
                   ["CreateFolder","RenameFile","SaveCopyOfFile","SearchFile","CompressFiles","ExtractArchive","ViewFileInfo","ShareFile"]),
  "maps": (["AddFavorite","AddMarker","RecordTrack"],
           ["SearchPlace","RemoveFavorite","DeleteMarker","GetDirections","SearchNearbyPlace","ExportLocation","ShareLocation"]),
  "contacts": (["AddContact","NewContactDraft"],
               ["EditContact","SearchContact","ViewContactDetails","AddFavoriteContact","RemoveFavoriteContact","DeleteContact","CallContact","MessageContact"]),
  "clock": (["CreateTimer","StopwatchRunning","PauseStopwatch"],
            ["CreateAlarm","EditAlarm","EnableAlarm","DeleteAlarm","StartTimer","StopwatchReset","AddWorldClock"]),
}
LABEL = {"tasks":"Tasks","notes":"Notes","finance":"Finance","music":"Music","calendar":"Calendar","sms":"SMS",
         "file_manager":"File Manager","maps":"Maps","contacts":"Contacts","clock":"Clock"}
FAMILY = {"UI-Venus-Navi-72B":"GUI-trained","UI-Venus-7B":"GUI-trained","GUI-Owl-7B":"GUI-trained","MAI-UI-8B":"GUI-trained",
          "UI Voyager-4B":"GUI-trained","Qwen3-VL-30B-A3B":"General","Qwen3-VL-8B":"General","Qwen2.5-VL-72B":"General",
          "Gemini-3.1-Pro":"Closed","GPT-5.1":"Closed","Gemini-3.1-Pro†":"Hybrid","GPT-5.1†":"Hybrid","Mobile-Agent-v3":"Agent"}

cats = []
for key, names in APPS.items():
    t = d["apps"][key]
    assert len(t["apps"]) == len(names), key
    aw, new = TEMPLATES[key]
    assert (len(aw), len(new)) == (t["n_aw_templates"], t["n_new_templates"]), key
    cats.append({
        "key": key, "label": LABEL[key],
        "apps": [{"name": n, "awOriginal": a["aw_original"]} for n, a in zip(names, t["apps"])],
        "awTemplates": aw, "newTemplates": new,
        # vals: per app [AW-templates SR, new-templates SR], pooled over three runs
        "rows": [{"model": r["model"], "vals": r["vals"]} for r in t["rows"]],
        "mean": t["mean"],
    })
lb = [{"model": r["model"], "family": FAMILY.get(r["model"]), "vals": r["vals"]} for r in d["table1"] if r["model"] != "Average"]
avg = next(r["vals"] for r in d["table1"] if r["model"] == "Average")
assert all(r["family"] for r in lb) and len(lb) == 13

js = ("// Generated from the tables of arXiv:2609.34139 (Table 1 and the per-category app tables).\n"
      "// Success rates are percentages; Δ is in percentage points.\n"
      "window.AAB_LEADERBOARD = " + json.dumps({"rows": lb, "average": avg}, ensure_ascii=False) + ";\n"
      "window.AAB_CATEGORIES = " + json.dumps(cats, ensure_ascii=False) + ";\n")
open(sys.argv[2], "w", encoding="utf-8").write(js)
print("ok", len(js))
