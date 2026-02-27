import { _decorator, AudioSource, Node, director, AudioClip, assetManager, sys } from 'cc';
import { UIPackage } from 'fairygui-cc';

/**
 * 音频管理器
 */
export class AudioManager {
    private static _instance: AudioManager;

    private _musicSource: AudioSource = null!; // 专门播 BGM
    private _sfxSource: AudioSource = null!;   // 专门播音效 (playOneShot)

    private _musicVolume: number = 0.8;
    private _sfxVolume: number = 1.0;

    // 本地存储的 Key
    private readonly KEY_MUSIC_VOL = 'SAVE_MUSIC_VOL';
    private readonly KEY_SFX_VOL = 'SAVE_SFX_VOL';

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
     * 接管 FairyGUI 内部的 playEffect 调用
     */
    private bridgeFairyGUI() {
        // 重写 FUI 的全局音效播放接口
        // @ts-ignore
        fgui.GRoot.inst.playEffect = (url: string, volumeScale: number) => {
            this.playSFXByUrl(url, volumeScale);
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

    /** 通过 FUI 的 URL 播放音效 (例如 "ui://Package/SoundName") */
    public playSFXByUrl(url: string, volumeScale: number = 1.0) {
        const item = UIPackage.getItemByURL(url);
        if (item && item.file) {
            // 获取 FUI 资源库里的 AudioClip
            const clip = item.owner.getItemAsset(item) as AudioClip;
            if (clip) {
                this.playSFX(clip, volumeScale);
            }
        }
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