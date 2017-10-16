export default {

    clamp : ( min, max, val ) => {
        return Math.min( Math.max( min, val ), max );
    }

};
