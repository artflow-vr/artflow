export default {

    hsv2rgb : ( hsv ) => {

        let r, g, b, i, f, p, q, t;
        let h = THREE.Math.clamp( hsv.h, 0, 1 );
        let s = THREE.Math.clamp( hsv.s, 0, 1 );
        let v = hsv.v;

        i = Math.floor( h * 6 );
        f = h * 6 - i;
        p = v * ( 1 - s );
        q = v * ( 1 - f * s );
        t = v * ( 1 - ( 1 - f ) * s );
        switch ( i % 6 ) {
          case 0: r = v; g = t; b = p; break;
          case 1: r = q; g = v; b = p; break;
          case 2: r = p; g = v; b = t; break;
          case 3: r = p; g = q; b = v; break;
          case 4: r = t; g = p; b = v; break;
          case 5: r = v; g = p; b = q; break;
        }
        return {
          r: Math.round( r ),
          g: Math.round( g ),
          b: Math.round( b )
        };

    }

};

