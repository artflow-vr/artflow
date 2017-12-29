import json
import matplotlib.image as mpimg
import math
import sys

if __name__ == "__main__":

    input = sys.argv[1]
    input_text = '{}.txt'.format(input)
    input_image = '{}.png'.format(input)

    img = mpimg.imread(input_image)

    width = img.shape[1]
    height = img.shape[0]

    next_width = 2**(math.ceil(math.log2(2 * width)) - 1)
    next_height = 2**(math.ceil(math.log2(2 * height)) - 1)

    y_offset = next_height - height

    if width != next_width and height != next_height:
        print('You should pack a new image: {}, {}'.format(next_width, next_height))

    f = open(input_text).read()
    f = f.split('\n')

    obj = {
        'file': input_image,
        'textures': []
    }

    f2 = open('json.spritesheet', 'w')
    for l in f:
        line = l.split(',')
        
        if len(line) < 5:
            continue
            
        name = line[0]
        x = line[1]
        y = line[2]
        w = line[3]
        h = line[4]
            
        y = (height - (int(y) + int(h)))
        print('{} : {}'.format(name, y))
        obj['textures'].append({'name': name, 'x' : x, 'y' : y, 'w' : w, 'h' : h})

    f2.write(json.dumps(obj, indent=2))
    f2.flush()
    f2.close
