import ArtflowMain from './main';


window.onload = function () {

    let w = window.innerWidth;
    let h = window.innerHeight;

    ArtflowMain.init( w, h );

    // Registers global events
    window.addEventListener( 'resize', function () {

        ArtflowMain.resize( window.innerWidth, window.innerHeight );

    }, false );

};
