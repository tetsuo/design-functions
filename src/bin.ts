/* eslint-disable no-console */
import { fork } from 'fluture'
import { designfun } from '.'

const main = fork(er => console.error(er instanceof Error ? er.message : er))(d => console.log(JSON.stringify(d)))

main(designfun(process.argv.slice(2)[0]))
