import Studio from '../studio';import {requirePage} from '../../lib/auth';export default async function Page(){await requirePage('/display');return <Studio display/>}
