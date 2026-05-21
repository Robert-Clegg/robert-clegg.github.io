import sys
JS   = r"C:\Users\rcleg\robert-clegg.github.io\petro-active\assets\main-DFoqPRSx.js"
HTML = r"C:\Users\rcleg\robert-clegg.github.io\petro-active\index.html"
with open(JS,   encoding="utf-8", errors="surrogateescape") as f: js   = f.read()
with open(HTML, encoding="utf-8", errors="surrogateescape") as f: html = f.read()
print("JS size: {:,}".format(len(js)))
errors = []

# P1 state + functions
OLD1 = "let mo=!1,De=null;"
NEW1 = """let mo=!1,De=null;
let wpActive=!1,wpTargetX=0,wpTargetZ=0,wpBeacon=null,wpFollowMode=!1,wpSessionStart=null,wpEvents=[],wpCount=0;
const WP_ARRIVE_DIST=8,WP_SPEED=4;
function wpLog(msg,type){const t=wpSessionStart?((performance.now()-wpSessionStart)/1e3).toFixed(3):"0.000";wpEvents.push({t:parseFloat(t),msg,type});console.log("[WP "+t+"s] "+msg);}
function wpCreateBeacon(x,y,z){if(wpBeacon){G.remove(wpBeacon);wpBeacon.children.forEach(function(c){if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});}var grp=new Ke();var pole=new T(new at(.4,.4,18,8),new ke({color:0xffeb3b,transparent:true,opacity:.9,depthWrite:false}));pole.position.y=9;grp.add(pole);var ring=new T(new at(6,6,32),new ke({color:0xffeb3b,transparent:true,opacity:.25,side:Nt,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.3;grp.add(ring);var tip=new T(new So(1,2,8),new ke({color:0xffeb3b,emissive:new F(0xffeb3b),emissiveIntensity:1.5,transparent:true,opacity:.95}));tip.position.y=19;grp.add(tip);grp.position.set(x,y,z);G.add(grp);wpBeacon=grp;}
function wpRemoveBeacon(){if(wpBeacon){G.remove(wpBeacon);wpBeacon.children.forEach(function(c){if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});wpBeacon=null;}}
function wpSetWaypoint(x,z){var y=W(x,z);wpTargetX=x;wpTargetZ=z;wpActive=true;wpCount++;wpCreateBeacon(x,y+.5,z);wpLog("WaypointSet x="+x.toFixed(0)+" z="+z.toFixed(0)+" y="+y.toFixed(1)+" count="+wpCount,"set");var hud=document.getElementById("wp-hud");if(hud){hud.textContent="WAYPOINT SET";hud.style.color="#ffeb3b";}}
function wpArrived(){wpActive=false;wpFollowMode=false;wpRemoveBeacon();wpLog("WaypointArrived","arrived");var hud=document.getElementById("wp-hud");if(hud){hud.textContent="ARRIVED -- press F to set another";hud.style.color="#69ff47";setTimeout(function(){if(hud){hud.textContent="[F] FOLLOW  |  RMB WAYPOINT";hud.style.color="#00e5ff";}},2000);}}"""
if OLD1 in js and "wpActive" not in js: js=js.replace(OLD1,NEW1,1); print("P1 OK")
elif "wpActive" in js: print("P1 SKIP already patched")
else: errors.append("P1 FAIL")

# P2 F key
OLD2 = 't.key.toLowerCase()==="t"&&$s()'
NEW2 = 't.key.toLowerCase()==="f"&&w&&(wpFollowMode=!wpFollowMode,wpLog("FollowMode "+(wpFollowMode?"ON":"OFF"),"mode"),function(){var hud=document.getElementById("wp-hud");if(hud){hud.textContent="FOLLOW MODE: "+(wpFollowMode?"ON -- right-click terrain":"OFF");hud.style.color=wpFollowMode?"#ffeb3b":"#00e5ff";}}()),t.key.toLowerCase()==="t"&&$s()'
if OLD2 in js: js=js.replace(OLD2,NEW2,1); print("P2 OK")
elif 'wpFollowMode=!wpFollowMode' in js: print("P2 SKIP already patched")
else: errors.append("P2 FAIL")

# P3 RMB -- anchor includes the comma+next listener
OLD3 = 'window.addEventListener("mousedown",t=>{t.button===0&&(jt=!0),t.button===2&&(Zt=!0)}),window.addEventListener("mous'
NEW3 = 'window.addEventListener("mousedown",t=>{t.button===0&&(jt=!0),t.button===2&&(Zt=!0,function(){if(!wpFollowMode||!w||!document.pointerLockElement)return;var rc=new io(),nd=new Fo(Re.x,Re.y);rc.setFromCamera(nd,re);var hits=rc.intersectObjects(Rt);if(hits.length>0){var pt=hits[0].point;if(!wpSessionStart)wpSessionStart=performance.now();wpSetWaypoint(pt.x,pt.z);}}())}),window.addEventListener("mous'
if OLD3 in js: js=js.replace(OLD3,NEW3,1); print("P3 OK")
elif 'wpSetWaypoint(pt.x' in js: print("P3 SKIP already patched")
else: errors.append("P3 FAIL: "+repr(js[js.find('addEventListener("mousedown"'):js.find('addEventListener("mousedown"')+100]))

# P4 autonomous movement
OLD4 = 'if(w.update(t),(c||ye||ue)&&(L.shadowMap.needsUpdate=!0)'
NEW4 = """if(wpActive&&w){var mp=w.getWorldPosition(),dx=wpTargetX-mp.x,dz=wpTargetZ-mp.z,dist=Math.sqrt(dx*dx+dz*dz);if(dist<WP_ARRIVE_DIST){wpArrived();}else{var spd=WP_SPEED*t/dist;w.setMovementInput(dx*spd,dz*spd);w.state.rotation=Math.atan2(dx,dz);}}
if(w.update(t),(c||ye||ue)&&(L.shadowMap.needsUpdate=!0)"""
if OLD4 in js: js=js.replace(OLD4,NEW4,1); print("P4 OK")
elif 'wpArrived()' in js: print("P4 SKIP already patched")
else: errors.append("P4 FAIL")

# P5 HUD -- correct anchor from live file
OLD5 = 'const r=document.getElementById("game-canvas");if(ee)'
NEW5 = 'const r=document.getElementById("game-canvas");var wpHudEl=document.createElement("div");wpHudEl.id="wp-hud";wpHudEl.style.cssText="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);font-family:Courier New,monospace;font-size:12px;font-weight:bold;color:#00e5ff;letter-spacing:3px;text-transform:uppercase;pointer-events:none;text-shadow:0 0 10px currentColor;background:rgba(0,0,0,0.55);padding:6px 18px;border:1px solid rgba(0,229,255,0.25);";wpHudEl.textContent="[F] FOLLOW  |  RMB WAYPOINT";document.body.appendChild(wpHudEl);if(ee)'
if OLD5 in js: js=js.replace(OLD5,NEW5,1); print("P5 OK")
elif 'wp-hud' in js: print("P5 SKIP already patched")
else: errors.append("P5 FAIL: "+repr(js[js.find('getElementById("game-canvas")'):js.find('getElementById("game-canvas")')+80]))

# HTML
OLD_H = '<div><span class="help-key">H</span> Toggle this help</div>'
NEW_H = """<div><span class="help-key">H</span> Toggle this help</div>
          <div><span class="help-key">F</span> Follow mode (waypoint)</div>
          <div><span class="help-key">RMB</span> Set waypoint</div>
          <div style="margin-top:8px;font-size:9px;opacity:0.4;text-align:center;letter-spacing:2px;">WP v1</div>"""
if OLD_H in html: html=html.replace(OLD_H,NEW_H,1); print("HTML OK")
elif "WP v1" in html: print("HTML SKIP already patched")
else: errors.append("HTML FAIL")

if errors:
  print("ERRORS:"); [print("  "+e) for e in errors]; sys.exit(1)

with open(JS,   "w", encoding="utf-8", errors="surrogateescape") as f: f.write(js)
with open(HTML, "w", encoding="utf-8", errors="surrogateescape") as f: f.write(html)
print("JS written: {:,} bytes".format(len(js)))
print("ALL DONE")
