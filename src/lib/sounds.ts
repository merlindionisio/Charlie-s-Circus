import { Howl } from 'howler';

class SoundManager {
  private music: Howl | null = null;
  private sfx: { [key: string]: Howl } = {};

  constructor() {
    this.sfx = {
      click: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-button-click-fee-2581.mp3'] }),
      yay: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-audience-cheer-and-applause-912.mp3'] }),
      crash: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-clown-horn-at-circus-715.mp3'] }),
      bounce: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-ping-pong-ball-bounce-2081.mp3'] }),
      wind: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-wind-sweeping-1148.mp3'], loop: true })
    };
  }

  playMusic() {
    if (!this.music) {
      this.music = new Howl({
        src: ['https://upload.wikimedia.org/wikipedia/commons/1/1a/Entry_of_the_Gladiators.ogg'],
        loop: true,
        volume: 0.2
      });
    }
    if (!this.music.playing()) {
      this.music.play();
    }
  }

  stopMusic() {
    this.music?.stop();
  }

  playSFX(name: string) {
    this.sfx[name]?.play();
  }

  setVolume(musicVol: number, sfxVol: number) {
    this.music?.volume(musicVol);
    Object.values(this.sfx).forEach(s => s.volume(sfxVol));
  }
}

export const soundManager = new SoundManager();
