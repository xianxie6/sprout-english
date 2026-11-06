// 用 macOS 自带的 GS 音色库（gs_instruments.dls）把音符表渲染成分轨 wav
// 用法：swift tools/render_midi.swift score.json 输出目录
// score.json：{duration, tracks:[{name, program, perc, events:[[起始秒, 时长秒, 音高, 力度]], bends:[[秒, 0..16383]]}]}
import AVFoundation

let args = CommandLine.arguments
let json = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: args[1]))) as! [String: Any]
let outDir = args[2]
let sr = 44100.0
let dur = json["duration"] as! Double
let dls = URL(fileURLWithPath: "/System/Library/Components/CoreAudio.component/Contents/Resources/gs_instruments.dls")
let block: AVAudioFrameCount = 128

for tr in json["tracks"] as! [[String: Any]] {
	let name = tr["name"] as! String
	let engine = AVAudioEngine()
	let sampler = AVAudioUnitSampler()
	engine.attach(sampler)
	let fmt = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 2)!
	engine.connect(sampler, to: engine.mainMixerNode, format: fmt)
	try engine.enableManualRenderingMode(.offline, format: fmt, maximumFrameCount: block)
	let perc = (tr["perc"] as? Bool) ?? false
	try sampler.loadSoundBankInstrument(at: dls, program: UInt8(tr["program"] as! Int), bankMSB: perc ? 0x78 : 0x79, bankLSB: 0)
	try engine.start()

	// 事件：(时间, 类型 0=松开 1=按下 2=弯音, 音高/弯音值, 力度)
	var evs: [(Double, Int, Int, Int)] = []
	for e in tr["events"] as! [[Double]] {
		evs.append((e[0], 1, Int(e[2]), Int(e[3])))
		evs.append((e[0] + e[1], 0, Int(e[2]), 0))
	}
	for b in (tr["bends"] as? [[Double]]) ?? [] { evs.append((b[0], 2, Int(b[1]), 0)) }
	evs.sort { $0.0 < $1.0 || ($0.0 == $1.0 && $0.1 < $1.1) }

	let settings: [String: Any] = [AVFormatIDKey: kAudioFormatLinearPCM, AVSampleRateKey: sr, AVNumberOfChannelsKey: 2, AVLinearPCMBitDepthKey: 32, AVLinearPCMIsFloatKey: true, AVLinearPCMIsNonInterleaved: false]
	let file = try AVAudioFile(forWriting: URL(fileURLWithPath: "\(outDir)/\(name).wav"), settings: settings, commonFormat: .pcmFormatFloat32, interleaved: false)
	let buf = AVAudioPCMBuffer(pcmFormat: engine.manualRenderingFormat, frameCapacity: block)!
	let total = AVAudioFramePosition(dur * sr)
	var i = 0
	while engine.manualRenderingSampleTime < total {
		let end = Double(engine.manualRenderingSampleTime + AVAudioFramePosition(block)) / sr
		while i < evs.count && evs[i].0 < end {
			let (_, k, n, v) = evs[i]
			if k == 1 { sampler.startNote(UInt8(n), withVelocity: UInt8(max(1, min(127, v))), onChannel: 0) }
			else if k == 0 { sampler.stopNote(UInt8(n), onChannel: 0) }
			else { sampler.sendPitchBend(UInt16(n), onChannel: 0) }
			i += 1
		}
		let st = try engine.renderOffline(block, to: buf)
		if st == .success { try file.write(from: buf) }
	}
	engine.stop()
	print("rendered \(name)")
}
