export default function getNextPowerTwo( nb ) {
    let i = 1;
    while ( i < nb )
        i *= 2;
    return i;
}

