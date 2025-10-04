# twitchevents-project
This is probably one of my favorite projects I've made, aside from OldTwitch & my current website. Spent a lot of everything & used a lot of everything for this project--if I could somehow put everything I've typed out into a gallery, I would. So please, enjoy *TwitchEvents*.


## Download
To download this project, click on the green `Code` button above the project files, then click on `Download ZIP`. **Extract the folder withhin zip file** wherever you'd like.

Or if you're not a dumbass, you can just use:
```
git clone https://github.com/ktg5/twitchevents-project.git
```


## Setup
Before we get to everything, open a terminal & make sure you have [winget](https://github.com/microsoft/winget-cli/releases/latest) installed by typing, `winget`

Then, run the following to install all the programs needed for this project under Windows:
```
winget install Gyan.FFmpeg Microsoft.PowerShell Node.js
```
This will install:
* [FFmpeg](https://ffmpeg.org/) - Used for the recording mic bit of `events/votes/midi.js`
* [PowerShell](https://learn.microsoft.com/powershell/) - Used for talking with Windows functions
* [Node.js](https://nodejs.org/) - To run this whole project

I should've also noted above that you can remove or add/make your own events for the *twitchevents-project*. You can find all the events via the `events` folder within the project folder. So if you don't like one event, delete it!

### Notes for specific events:
 - `votes/no-audio`: **If you use a Voicemeeter output device as your default audio device**, you'll need to download [Frosthaven/voicemeeter-windows-volume](https://github.com/Frosthaven/voicemeeter-windows-volume/releases/latest) to get the Windows sound mixer to work with Voicemeeter. [**Please follow this guide if you have do idea what the hell this is**]() (which will be made soon)
 - `votes/funny-mic`, `votes/invert-mouse` & `votes/small-mouse`: These events only use the TwitchEvents.Tts class to tell the client/streamer to do whatever the event is. There is no actual code being executed. If you'd like to remove these--especially `small-mouse` since it's just for me kinda--you may.

## Setup Pt.2
Once done, close your current terminal & press `Windows Key` & `R`. Then type `pwsh` to launch the version of PowerShell we just installed.

Then `cd` into the *twitchevents-project* folder. To get to the folder of the *twitchevents-project* within PowerShell, select the folder of what you extracted within File Explorer, then hold `Shift` & `Right Mouse Button` and click on, `Copy as path` below the, `Send to` context-menu button. From there, you can type in PowerShell: `cd` and then right-click the PowerShell window to paste the folder path.

Once in the project folder, type `npm i` to install the modules.

Then type `notepad config.json` to configure the config file. From here, you'll want to change the `user` option to the username on your Twitch. You can also mess with the numbers for timing, but just know, they're in minutes.

Once done with editing the config file, you can run `npm start` to start running the *twitchevents-project*.


## OBS Stuff
To show your viewers event polls & event custom displays, you'll need the `TwitchEvents Event Web` url provided when you start the *twitchevents-project*. It'll display first thing from `TwitchEvents` in the console/terminal. You can copy the click provided in that log, & put it into a browser source on your OBS.

The `TwitchEvents Event Web` runs the your computer with the port provided under the `webPort` number in the *twitchevents-project* config file, I'd recommend not having it open but outsiders can't do much with it (from what I've developed it to do).