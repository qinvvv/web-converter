window.addEventListener('load', function () {
    console.log('1.0.1')
    document.getElementById('dragContainer').addEventListener('dragover', function(e) {
        e.stopPropagation()
        e.preventDefault()
        document.getElementById('dragContainer').style.border = '1px solid white'
        document.getElementById('dragContainer').style.backgroundColor = 'rgb(63, 63, 63)'
    })


    document.getElementById('dragContainer').addEventListener('dragleave', function(e) {
        e.stopPropagation()
        e.preventDefault()
        document.getElementById('dragContainer').style.border = '1px solid gray'
        document.getElementById('dragContainer').style.backgroundColor = 'rgb(45, 45, 45)'
    })

    document.getElementById('dragContainer').addEventListener('drop', function(e) {
        e.stopPropagation()
        e.preventDefault()
        
        let oldFile = e.dataTransfer.files[0]
        let mapName = oldFile.name
        let fileType = oldFile.name.split('.').pop()
        let file = fileType == 'osz' || 'qp' ? new File([oldFile], "file.zip") : e.dataTransfer.files[0]
        let nameDiv = document.createElement('div');
        nameDiv.textContent = mapName
        nameDiv.setAttribute('class', 'mapName')
        document.getElementById('levelData').append(nameDiv)

        let read = new FileReader()

        let fileTypes1 = ['qp', 'osz']
        let fileTypes2 = ['gpop', 'osu']
        let ext = ['qua', 'osu']

        read.onload = function() {
            if (fileTypes1.concat(fileTypes2).includes(fileType))
            {
                if (fileTypes2.includes(fileType)) 
                {
                    let mapData = read.result
                    var h = cv(mapData, fileType)
                    var notes = h[0]
                    var keymode = h[1]
                }
                else
                {
                    var zip = new JSZip()
                    zip.loadAsync(file).then(function(f) 
                    {
                        let diffs = document.createElement('select');
                        diffs.setAttribute('id', 'diffs')
                        document.getElementById('levelData').append(diffs)

                        let diffAmount = 1
                        for (let map in f.files)
                        {
                         let u = map.split('.').pop()
                         if (ext.includes(u)) 
                         {
                            let mapdiff = document.createElement('option');
                            mapdiff.setAttribute('value', diffAmount)
                            mapdiff.textContent = map;
                            diffs.appendChild(mapdiff)
                            diffAmount++
                         }
                        }
                    })
                }

                document.getElementById('dragContainer').classList.add('hide')
                document.getElementById('levelData').style.display = 'flex'
                document.getElementById('levelData').classList.add('show')
                document.getElementById('backButton').addEventListener("click", function(event) 
                { 
                    window.location.reload();
                })

                for (let i = 0; i < document.getElementsByClassName('pageButton').length; i++) 
                {
                    document.getElementsByClassName('pageButton')[i].addEventListener("click", function(event) 
                    { 
                        if (fileTypes2.includes(fileType)) 
                        {
                            cv2(event.target.classList[1], notes, document.getElementById('offset').value, keymode) 
                        }
                        else 
                        {
                            zip.loadAsync(file).then(function(f) 
                            {
                                f.file(document.getElementById('diffs').options[document.getElementById('diffs').selectedIndex].text+``).async("String").then(function(mapData) 
                                {
                                    let h = cv(mapData, fileType)
                                    let notes = h[0]
                                    let keymode = h[1]
                                    keymode != 4 && keymode != 6 && event.target.classList[1] == 'gpop' ? alert(`Gpop does not support keymodes other than 4k and 6k!\nMap keymode: ${keymode}`) : '' 
                                    keymode != 4 && keymode != 7 && event.target.classList[1] == 'qp' ? alert(`Quaver does not support keymodes other than 4k and 7k!\nMap keymode: ${keymode}`) : '' 
                                    cv2(event.target.classList[1], notes, document.getElementById('offset').value, keymode) 
                                })
                            })
                        }
                    })
                }
                if (fileType == 'osu') {document.querySelector(`#levelData > button.pageButton.osz`).remove()}
                document.querySelector(`#levelData > button.pageButton.${fileType}`).remove()
            }
            else {
                alert('Invalid file type')
            }

        }
        read.readAsText(file)
        document.getElementById('dragContainer').style.border = '1px solid gray'
        document.getElementById('dragContainer').style.backgroundColor = 'rgb(45, 45, 45)'
    })

    function cv(data, fileType) 
    {
        if (fileType == 'qp')
        {
            let notes = []
            let keys = parseInt(data.split('Mode: Keys')[1].split('\n')[0])
            let oldNotes = data.split('HitObjects:')[1].split('\r').toString().split('\n').slice(0, -1).slice(1)
            for (let index = 0; index < oldNotes.length; index++)
            {
                try 
                {
                    let note = oldNotes[index].trim()

                    if (note.startsWith('- StartTime: ') == true)
                    {
                        let endTime;
                        let time = parseInt(note.split('- StartTime: ')[1].split('\n')[0])
                        let lane = parseInt(oldNotes[index+1].trim().split('Lane: ')[1].split('\n')[0])
                        oldNotes[index+2].trim().startsWith('EndTime: ') == true ? endTime = parseInt(oldNotes[index+2].trim().split('EndTime: ')[1].split('\n')[0]) : endTime = 0
                        notes.push(`${lane}|${time}|${endTime}`)
                    } 
                } catch (er) {console.log(er)}
            }
            return [notes, keys]
        }
        if (fileType == 'osz' || fileType == 'osu')
        {
            let notes = []
            let keys = parseInt(data.split('CircleSize:')[1].split('\n')[0])
            let oldNotes = data.split('[HitObjects]')[1].split('\r').toString().split('\n').slice(0, -1).slice(1)
            for (let index = 0; index < oldNotes.length; index++)
            {
                try
                {
                    let noteData = oldNotes[index].replace('\n','').split(',')
                    let lane = Math.floor(noteData[0] * keys / 512)
                    let time = noteData[2]
                    let endTime = noteData[5].length == 8 ? '0' : noteData[5].split(':')[0]
                    notes.push(`${lane+1}|${time}|${endTime}`)
                }
                catch (er) {console.log(er)}
            }
            return [notes, keys]
        }

        if (fileType == 'gpop') 
        {
            let keys;
            data.toString().indexOf(':11}},') !== -1 ? keys = 6 : keys = 4 
            let notes = []
            let oldNotes = data.replace(']', '').split('}},')[1].split(',')
            let laneList = {
                "0":"1",
                "1":"1",
                "2":"2",
                "3":"2",
                "4":"3",
                "5":"3",
                "6":"4",
                "7":"4",
                "8":"5",
                "9":"5",
                "10":"6",
                "11":"6"
            }

            for (let index = 0; index < data.length; index++) 
            {
                try 
                {
                    if (oldNotes[index].length == 1)
                    { 
                        let lane = laneList[oldNotes[index]]
                        let time = parseFloat(oldNotes[index+1])
                        let endTime = oldNotes[index] % 2 != 0 ? (parseFloat(oldNotes[index+2]) + time).toFixed(3) : '0'
                        notes.push(`${lane}|${parseInt(time.toFixed(3).replace('.',''),10)}|${parseInt(endTime.replace('.',''),10)}`)
                    }
                }
                catch (er) {}
            }
            return [notes, keys];
        }
    }
    function cv2(game, notes, offset, keymode) 
    {
        offset == '' ? offset = 0 : offset = parseInt(offset)
        if (game == 'qp')
        {
             let fill = Math.floor(Math.random() * 100000000)
             let fileFormat = `AudioFile:
BackgroundFile: ''
MapId: 52145
MapSetId: 9043
Mode: Keys${keymode}
Title: ${'convertedmap ',fill}
Artist: artist
Source: ''
Tags: 
Creator: 'convertedmap'
DifficultyName: 'convertedmapdiff'
Description: Created at 1626588180000
EditorLayers: []
CustomAudioSamples: []
SoundEffects: []
TimingPoints:
- Bpm: 100
SliderVelocities: []
HitObjects:\n`
            for (index = 0; index < notes.length; index++)
            {
                let cnote = notes[index].split('|')
                let lane = parseInt(cnote[0])
                let time = parseInt(cnote[1])
                let endTime = parseInt(cnote[2])
                cnote[2] == 0 ? fileFormat = fileFormat.concat(`- StartTime: ${time+offset}\n  Lane: ${lane}\n  KeySounds: []\n`) : fileFormat = fileFormat.concat(`- StartTime: ${time+offset}\n  Lane: ${lane}\n  EndTime: ${endTime+offset}\n  KeySounds: []\n`)
            }
            var zip = new JSZip()
            zip.file(`${fill}.qua`, fileFormat)
            zip.file(`audio.mp3`, '')
            zip.generateAsync({type:"blob"}).then(function (blob) {
             saveAs(blob, `${fill}.qp`)
            });
        }
        if (game == 'osz') 
        {
            let fill = Math.floor(Math.random() * 100000000)
            let fileFormat = `osu file format v14

[General]
AudioFilename: audio.mp3
AudioLeadIn: 0
PreviewTime: -1
Countdown: 0
SampleSet: Normal
StackLeniency: 0.7
Mode: 3
LetterboxInBreaks: 0
SpecialStyle: 0
WidescreenStoryboard: 0

[Editor]
DistanceSpacing: 2
BeatDivisor: 4
GridSize: 16
TimelineZoom: 1

[Metadata]
Title: ${fill}
TitleUnicode: ${fill}
Artist: x
ArtistUnicode: x
Creator: x
Version: 1
Source: x
Tags: x
BeatmapID: ${fill}
BeatmapSetID: ${fill}

[Difficulty]
HPDrainRate:7
CircleSize:${keymode}
OverallDifficulty:8
ApproachRate:5
SliderMultiplier:1.4
SliderTickRate:1

[Events]
//Background and Video events
//Break Periods
//Storyboard Layer 0 (Background)
//Storyboard Layer 1 (Fail)
//Storyboard Layer 2 (Pass)
//Storyboard Layer 3 (Foreground)
//Storyboard Layer 4 (Overlay)
//Storyboard Sound Samples

[TimingPoints]
0,600,4,0,0,100,1,0


[HitObjects]\n`

            for (let index = 0; index < notes.length; index++)
            {
                let cnote = notes[index].split('|')
                let lane = Math.floor(512 * cnote[0] / keymode - 64);
                cnote[2] == 0 ? fileFormat = fileFormat.concat(`${lane},192,${parseInt(cnote[1])+offset},1,0,0:0:0:0:\n`) : fileFormat = fileFormat.concat(`${lane},192,${parseInt(cnote[1])+offset},128,0,${parseInt(cnote[2])+offset}:0:0:0:0:\n`)
            }
            
            var zip = new JSZip()
            zip.file(`${fill}.osu`, fileFormat)
            zip.generateAsync({type:"blob"}).then(function (blob) {
             saveAs(blob, `${fill}.osz`)
            });
        }
        if (game == 'gpop')
        {
            offset = offset/1000
            let fileFormat;

            keymode == 4 ? fileFormat = '[{"type":"s2","dict":{"a":0,"a1":1,"s":2,"s1":3,"d":4,"d1":5,"f":6,"f1":7}}' : fileFormat = '[{"type":"s2","dict":{"a":0,"a1":1,"s":2,"s1":3,"d":4,"d1":5,"j":6,"j1":7,"k":8,"k1":9,"l":10,"l1":11}}'
            for (let index = 0; index < notes.length; index++)
            {
                let cnote = notes[index].split('|')
                let lane = parseInt(cnote[0]) * 2 - 2
                let noteTime = parseInt(cnote[1])/1000
                let noteEndTime = parseInt(cnote[2])/1000
                noteEndTime == 0 ? fileFormat = fileFormat.concat(`,${lane},${noteTime+offset}`) :  fileFormat = fileFormat.concat(`,${lane+1},${noteTime+offset},${noteEndTime-noteTime}`)
            }
            fileFormat = fileFormat.concat(']')
            let f = new Blob([fileFormat], { type: "text/plain;charset=utf-8" })
            saveAs(f, "map.gpop")
            
        }
    }
})
