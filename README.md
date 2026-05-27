# SHEΔR iQ Shear Tracker

## How to launch the app

The SHEΔR iQ Shear Tracker is a **local web app**. It does not open like a normal hosted website on the internet. Instead, it must be started with the local startup script:

`start_sheartracker.bat`

That script starts two local services:

- Local web server on `http://localhost:8080`
- Shelly proxy/helper on `http://localhost:5000`

Why both are needed:

- The web server (`localhost:8080`) serves the app page so it can load correctly in the browser.
- The proxy/helper (`localhost:5000`) lets the app communicate with the Shelly device for **live motor ON/OFF tracking**.

After startup, the script automatically opens:

`http://localhost:8080/index.html`

Keep the command windows open while using the app. If those windows are closed, the app may stop loading and/or live Shelly tracking may stop working.

## Normal startup steps

1. Double-click `start_sheartracker.bat`.
2. Wait for the browser to open automatically.
3. Leave the proxy/server command windows running.
4. Use the app in the browser.

## After pulling code updates

After a PR is merged and you run `git pull` in VS Code, use this workflow:

1. Pull the latest code in VS Code.
2. Close the old browser tab if needed.
3. Close old ShearTracker command windows if the app does not refresh properly.
4. Double-click `start_sheartracker.bat` again.
5. The browser should reopen automatically.
6. If the old version still appears, do a hard refresh.

Notes for common refresh issues:

- If the browser still shows the old version, it may be using a cached copy.
- A saved browser tab can sometimes reopen an older cached version.
- Hard reload / empty cache may be needed after updates.
- If the app says **localhost refused to connect**, the local web server is usually not running.
- If the page loads but live Shelly tracking fails, the proxy/helper may not be running, or the laptop may not be connected to the Shelly Wi-Fi/AP.

## What works without the Shelly

- You can use **Simulation mode** without a Shelly connection.
- You can use manual **Motor ON / Motor OFF** buttons for testing.
- Live automatic motor tracking requires both the Shelly connection and the proxy/helper running.

## Real Evo/Shelly connection workflow

1. **Power on the shearing plant.**  
   Plug in and power on the Heiniger Evo shearing plant. This also powers the Shelly inside the plant.
2. **Connect laptop Wi-Fi to `Shear-Tracker-Shelly`.**  
   If Windows says **No internet**, this is normal for this setup.
3. **On the laptop desktop/home screen, open `Shear Tracker Launcher`.**  
   Double-clicking it opens two command windows (`ShearTracker Web` and `ShearTracker Proxy`) and should also open a browser tab at: `http://localhost:8080/index.html`. That browser tab is the SHEΔR iQ Shear Tracker app.
4. **Keep command windows open.**  
   If they are closed, the app may stop loading or stop talking to the Shelly.
5. **In the app, open Settings → Connection Settings and confirm:**
   - Shelly IP: `192.168.33.1`
   - Endpoint Mode: `/rpc/Shelly.GetStatus (gen2+)`
   - Poll Interval: `200`
6. **Click `Test Connection`.**  
   You want: Connection `ok`, Motor `ON` or `OFF`, and a response time shown in ms.
7. **Return to Dashboard and set Simulation Mode = OFF.**
8. **Click `Start Run`.**
9. **Pull the Evo cord** to start the motor.  
   You should see Trigger state `ON` and current shear time counting.
10. **Stop the motor.**  
    You should see Trigger state `OFF` and a sheep entry added to Sheep Log.

Troubleshooting:

- **App does not open:** double-click `Shear Tracker Launcher` again and keep command windows open.
- **Test Connection fails:** confirm Wi-Fi `Shear-Tracker-Shelly`, Shelly IP `192.168.33.1`, Endpoint Mode `/rpc/Shelly.GetStatus (gen2+)`, and command windows still running.
- **Pulling cord does nothing:** confirm Simulation Mode is OFF, Start Run was clicked, and Test Connection says Connection `ok`.
- **Sheep is not logged:** logging happens only after motor ON then motor OFF, and only after the run has started.

## Plain-English architecture

```text
Browser app
→ local web server on localhost:8080
→ local proxy/helper on localhost:5000
→ Shelly device at 192.168.33.1
→ motor ON/OFF signals
```

Quick meaning of addresses:

- `localhost` means **this computer**.
- `8080` is the local app page.
- `5000` is the local Shelly helper/proxy.
