import { Idl, Program } from '@project-serum/anchor';
import provider from "./AnchorProvider";
import { programId } from "./constants";
import idl from '../../../../target/idl/crypton_test.json';

const anchorProgram = new Program(idl as Idl, programId, provider);
export default anchorProgram;