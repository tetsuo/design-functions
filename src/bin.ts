/* eslint-disable no-console */
import { fork } from 'fluture'
import { flow } from 'fp-ts/lib/function'
import { designfun } from '.'

const main = fork(er => console.error(er instanceof Error ? er.message : er))(flow(JSON.stringify, console.log))

main(designfun(process.argv.slice(2)[0]))
