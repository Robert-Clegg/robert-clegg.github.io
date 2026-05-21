import sys

f = 'virus-sim/index.html'
c = open(f, 'r', encoding='utf-8', errors='surrogateescape').read()

anchor = 'loadInputRef.current.click()'
idx = c.find(anchor)
if idx == -1:
    print('ERROR: anchor not found'); sys.exit(1)

start = c.rfind('React.createElement("button"', 0, idx)
if start == -1:
    print('ERROR: button element not found'); sys.exit(1)

end_str = '"\\u2795 LOAD"))'
end = c.find(end_str, idx)
if end == -1:
    print('ERROR: end marker not found'); sys.exit(1)
end += len(end_str)

print('Found block at chars', start, '-', end)

new = (
    'React.createElement("label",'
    '{style:{fontFamily:mono,fontSize:8,letterSpacing:1,padding:"2px 8px",borderRadius:3,border:"1px solid",'
    'cursor:"pointer",background:"rgba(0,255,136,0.15)",borderColor:"rgba(0,255,136,0.5)",'
    'color:"#00ff88",marginLeft:4,display:"inline-block"}},'
    '"\\u2795 LOAD",'
    'React.createElement("input",{type:"file",multiple:true,accept:"video/*,.json",style:{display:"none"},'
    'onChange:e=>{Array.from(e.target.files).forEach(f=>{'
    'if(f.name.includes("_player")&&f.type.startsWith("video/"))handleVideoFile(f);'
    'else if(f.name.includes("_overview")&&f.type.startsWith("video/"))handleOverviewFile(f);'
    'else if(f.name.includes("_action")&&f.type.startsWith("video/"))handleActionFile(f);'
    'else if(f.type.startsWith("video/"))handleVideoFile(f);'
    'else if(f.name.endsWith("_sync.json"))handleSyncFile(f);'
    'else if(f.name.endsWith(".json"))parseTelemetryFile(f);'
    '});e.target.value=""}}))'
)

result = c[:start] + new + c[end:]
open(f, 'w', encoding='utf-8', errors='surrogateescape').write(result)
remaining = result.count('loadInputRef.current.click()')
print('Done. Broken .click() calls remaining:', remaining, '(should be 0)')
