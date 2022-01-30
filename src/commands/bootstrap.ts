/// <reference path="./linus.d.ts"/>

import distro from 'linus'
import { log } from '..'
import { BIN_NAME, ENGINE_DIR } from '../constants'
import { dispatch } from '../utils'
import { pacmanInstall } from './bootstrap/arch'
import { aptInstall } from './bootstrap/debian'

export const bootstrap = async () => {
  if (process.platform == 'win32')
    log.error(
      `You do not need to bootstrap on Windows. As long as you ran |${BIN_NAME} download-artifacts| everything should work fine.`
    )

  log.info(`Bootstrapping Dot Browser for Desktop...`)

  const args = ['--application-choice', 'browser']

  if (process.platform === 'linux') {
    linuxBootstrap()
  } else {
    console.info(
      `Custom bootstrapping doesn't work on ${process.platform}. Consider contributing to improve support`
    )

    console.info(`Passing through to |mach bootstrap|`)

    await dispatch(`./mach`, ['bootstrap', ...args], ENGINE_DIR)
  }
}

function getDistro(): Promise<string> {
  return new Promise((resolve, reject) => {
    distro.name((err: Error, name: string) => {
      if (name) resolve(name)
      else {
        reject(err || 'Failed to get linux distro')
      }
    })
  })
}

async function linuxBootstrap() {
  const distro = await getDistro()

  switch (distro) {
    // Both arch and manjaro use the same package repo and the same package manager
    case 'ManjaroLinux':
    case 'ArchLinux':
      console.log(
        await pacmanInstall(
          // Shared packages
          'base-devel',
          'nodejs',
          'unzip',
          'zip',

          // Needed for desktop apps
          'alsa-lib',
          'dbus-glib',
          'gtk3',
          'libevent',
          'libvpx',
          'libxt',
          'mime-types',
          'nasm',
          'startup-notification',
          'gst-plugins-base-libs',
          'libpulse',
          'xorg-server-xvfb',
          'gst-libav',
          'gst-plugins-good',
          'wasi-libc'
        )
      )
      break

    case 'Debian':
    case 'Ubuntu':
    case 'Pop':
      console.log(
        await aptInstall(
          'python3-distutils',
          'libssl-dev',
          'build-essential',
          'libpulse-dev',
          'clang',
          'nasm',
          'libpango1.0-dev',
          'libx11-dev',
          'libx11-xcb-dev',
          'libgtk-3-dev',
          'm4',
          'libgtk2.0-dev',
          'libdbus-glib-1-dev',
          'libxt-dev'
        )
      )
      break

    default:
      log.error(`Unimplemented distro '${distro}'`)
  }
}
