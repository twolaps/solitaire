import { _decorator, AudioSource, Node, director, AudioClip, assetManager, sys } from 'cc';
import { GRoot, UIPackage } from 'fairygui-cc';

/**
 * 音频管理器：单例，负责 BGM、音效播放与音量持久化；并接管 FairyGUI 按钮音效
 */
export class AudioManager {
    private static _instance: AudioManager;

    /** 专门播 BGM 的 AudioSource */
    private _musicSource: AudioSource = null!;
    /** 专门播音效的 AudioSource（playOneShot） */
    private _sfxSource: AudioSource = null!;

    /** 当前 BGM 音量，会持久化 */
    private _musicVolume: number = 0.8;
    /** 当前音效音量，会持久化 */
    private _sfxVolume: number = 1.0;

    /** 音效资源缓存（按路径），避免重复加载 */
    private _effectCache: Map<string, AudioClip> = new Map();

    private readonly KEY_MUSIC_VOL = 'SAVE_MUSIC_VOL';
    private readonly KEY_SFX_VOL = 'SAVE_SFX_VOL';

    /** 单例访问 */
    public static get inst(): AudioManager {
        if (!this._instance) this._instance = new AudioManager();
        return this._instance;
    }

    constructor() {
        this.init();
    }

    private init() {
        // 1. 创建持久化节点
        const audioNode = new Node('__AudioManager__');
        director.addPersistRootNode(audioNode);

        // 2. 添加两个音频源（分离 BGM 和音效，方便独立控制音量）
        this._musicSource = audioNode.addComponent(AudioSource);
        this._sfxSource = audioNode.addComponent(AudioSource);

        // 3. 读取本地存档
        this._musicVolume = parseFloat(sys.localStorage.getItem(this.KEY_MUSIC_VOL) || '0.8');
        this._sfxVolume = parseFloat(sys.localStorage.getItem(this.KEY_SFX_VOL) || '1.0');

        this._musicSource.volume = this._musicVolume;
        this._sfxSource.volume = this._sfxVolume;

        // 4. 重要：拦截 FairyGUI 编辑器里设置的按钮音效
        this.bridgeFairyGUI();
    }

    /**
     * 接管 FairyGUI 内部的 playEffect 调用（FUI 传入 url 格式 "ui://包名/组件名"）
     */
    private bridgeFairyGUI() {
        // @ts-ignore
        GRoot.inst.playEffect = (url: string, volumeScale: number) => {
            const match = url.match(/^ui:\/\/([^/]+)\/(.+)$/);
            if (match) {
                this.playSFXByName(match[1], match[2], volumeScale);
            }
        };
    }

    // ================== 背景音乐 BGM ==================

    /** 播放 BGM (支持传 AudioClip 或 资源路径) */
    public playMusic(clip: AudioClip) {
        if (this._musicSource.clip === clip && this._musicSource.playing) return;
        
        this._musicSource.stop();
        this._musicSource.clip = clip;
        this._musicSource.loop = true;
        this._musicSource.play();
    }

    public stopMusic() {
        this._musicSource.stop();
    }

    // ================== 音效 SFX ==================

    /** 播放音效 */
    public playSFX(clip: AudioClip, volumeScale: number = 1.0) {
        // 使用 playOneShot 允许音效叠加播放
        this._sfxSource.playOneShot(clip, volumeScale * this._sfxVolume);
    }

    /**
     * 通过包名 + 组件名播放 FUI 音效 (例如 pkgName="Package1", itemName="SoundClick")
     * @param pkgName FairyGUI 包名
     * @param itemName 资源名（如音效名）
     * @param volumeScale 音量缩放，默认 1
     * @param loopCount 播放次数：>0 为次数，默认 1；0 为无限循环
     */
    public playSFXByName(pkgName: string, itemName: string, volumeScale: number = 1, loopCount: number = 1) {
        const url = UIPackage.getItemURL(pkgName, itemName);
        const item = UIPackage.getItemByURL(url);
        if (!item || !item.file) return;
        const clip = item.owner.getItemAsset(item) as AudioClip;
        if (!clip) return;

        const vol = volumeScale * this._sfxVolume;
        const duration = (clip as any).duration ?? 0.5; // 音效时长，无则默认 0.5s

        if (loopCount === 1) {
            this._sfxSource.playOneShot(clip, vol);
            return;
        }
        if (loopCount === 0) {
            const playLoop = () => {
                this._sfxSource.playOneShot(clip, vol);
                this._sfxSource.scheduleOnce(playLoop, duration);
            };
            playLoop();
            return;
        }
        // loopCount > 1：先播一次，再定时重复
        this._sfxSource.playOneShot(clip, vol);
        this._sfxSource.schedule(() => {
            this._sfxSource.playOneShot(clip, vol);
        }, duration, loopCount - 1, 0);
    }

    /**
     * 通过 resources 路径播放音效 (例如 "music/move"，路径相对于 resources 目录)
     * 首次加载会缓存，后续播放直接使用缓存
     */
    public async playEffectByRes(resPath: string, volumeScale: number = 1.0): Promise<void> {
        let clip = this._effectCache.get(resPath);
        if (!clip) {
            try {
                clip = await new Promise<AudioClip>((resolve, reject) => {
                    assetManager.resources.load(resPath, AudioClip, (err, res) => {
                        if (err) reject(err);
                        else resolve(res as AudioClip);
                    });
                });
                this._effectCache.set(resPath, clip);
            } catch (e) {
                console.warn(`[AudioManager] playEffectByRes 加载失败: ${resPath}`, e);
                return;
            }
        }
        this.playSFX(clip, volumeScale);
    }

    // ================== 设置与持久化 ==================

    public setMusicVolume(vol: number) {
        this._musicVolume = vol;
        this._musicSource.volume = vol;
        sys.localStorage.setItem(this.KEY_MUSIC_VOL, vol.toString());
    }

    public setSFXVolume(vol: number) {
        this._sfxVolume = vol;
        // playOneShot 的音量在播放时决定，这里仅保存数值
        sys.localStorage.setItem(this.KEY_SFX_VOL, vol.toString());
    }

    public get musicVolume() { return this._musicVolume; }
    public get sfxVolume() { return this._sfxVolume; }
}