import json
import xml.etree.ElementTree as ET
import os

def parse_tsx(tsx_path):
    tree = ET.parse(tsx_path)
    root = tree.getroot()
    
    tileset_data = {
        "name": root.attrib['name'],
        "tilewidth": int(root.attrib['tilewidth']),
        "tileheight": int(root.attrib['tileheight']),
        "tilecount": int(root.attrib['tilecount']),
        "columns": int(root.attrib.get('columns', 0)),
        "margin": int(root.attrib.get('margin', 0)),
        "spacing": int(root.attrib.get('spacing', 0)),
        "tiles": []
    }
    
    img = root.find('image')
    if img is not None:
        tileset_data["image"] = os.path.splitext(img.attrib['source'])[0]
        tileset_data["imagewidth"] = int(img.attrib['width'])
        tileset_data["imageheight"] = int(img.attrib['height'])
    
    for tile in root.findall('tile'):
        t_data = {"id": int(tile.attrib['id'])}
        
        # Image collection support
        t_img = tile.find('image')
        if t_img is not None:
            t_data["image"] = os.path.splitext(t_img.attrib['source'])[0]
            t_data["imagewidth"] = int(t_img.attrib['width'])
            t_data["imageheight"] = int(t_img.attrib['height'])
        
        # Animations
        animation = tile.find('animation')
        if animation is not None:
            t_data["animation"] = []
            for frame in animation.findall('frame'):
                t_data["animation"].append({
                    "duration": int(frame.attrib['duration']),
                    "tileid": int(frame.attrib['tileid'])
                })
        
        # Properties
        properties = tile.find('properties')
        if properties is not None:
            t_data["properties"] = []
            for prop in properties.findall('property'):
                t_data["properties"].append({
                    "name": prop.attrib['name'],
                    "type": prop.attrib.get('type', 'string'),
                    "value": prop.attrib['value']
                })
        
        tileset_data["tiles"].append(t_data)
        
    return tileset_data

def tmx_to_json(tmx_path, json_path):
    tree = ET.parse(tmx_path)
    root = tree.getroot()
    base_dir = os.path.dirname(tmx_path)

    map_data = {
        "width": int(root.attrib['width']),
        "height": int(root.attrib['height']),
        "tilewidth": int(root.attrib['tilewidth']),
        "tileheight": int(root.attrib['tileheight']),
        "orientation": root.attrib['orientation'],
        "renderorder": root.attrib['renderorder'],
        "tiledversion": root.attrib.get('tiledversion', '1.11.2'),
        "version": root.attrib.get('version', '1.10'),
        "type": "map",
        "nextlayerid": int(root.attrib['nextlayerid']),
        "nextobjectid": int(root.attrib['nextobjectid']),
        "tilesets": [],
        "layers": []
    }

    for ts in root.findall('tileset'):
        firstgid = int(ts.attrib['firstgid'])
        if 'source' in ts.attrib:
            tsx_path = os.path.join(base_dir, ts.attrib['source'])
            if os.path.exists(tsx_path):
                tileset_data = parse_tsx(tsx_path)
                tileset_data['firstgid'] = firstgid
                map_data['tilesets'].append(tileset_data)
            else:
                print(f"Warning: TSX not found: {tsx_path}")
        else:
            # Inline tileset
            img = ts.find('image')
            tileset_data = {
                "firstgid": firstgid,
                "name": ts.attrib['name'],
                "tilewidth": int(ts.attrib['tilewidth']),
                "tileheight": int(ts.attrib['tileheight']),
                "tilecount": int(ts.attrib['tilecount']),
                "columns": int(ts.attrib['columns'])
            }
            if img is not None:
                tileset_data["image"] = os.path.splitext(img.attrib['source'])[0]
                tileset_data["imagewidth"] = int(img.attrib['width'])
                tileset_data["imageheight"] = int(img.attrib['height'])
            map_data['tilesets'].append(tileset_data)

    # Layers
    for layer in root.findall('layer'):
        l_data = {
            "id": int(layer.attrib['id']),
            "name": layer.attrib['name'],
            "type": "tilelayer",
            "visible": int(layer.attrib.get('visible', 1)) == 1,
            "opacity": float(layer.attrib.get('opacity', 1.0)),
            "width": int(layer.attrib['width']),
            "height": int(layer.attrib['height']),
            "x": 0, "y": 0, "data": []
        }
        data_tag = layer.find('data')
        if data_tag is not None and data_tag.attrib.get('encoding') == 'csv':
            l_data['data'] = [int(x.strip()) for x in data_tag.text.strip().split(',') if x.strip()]
        map_data['layers'].append(l_data)

    # Groups
    for group in root.findall('group'):
        for layer in group.findall('layer'):
            l_data = {
                "id": int(layer.attrib['id']),
                "name": layer.attrib['name'],
                "type": "tilelayer",
                "visible": int(layer.attrib.get('visible', 1)) == 1,
                "opacity": float(group.attrib.get('opacity', 1.0)) * float(layer.attrib.get('opacity', 1.0)),
                "width": int(layer.attrib['width']),
                "height": int(layer.attrib['height']),
                "x": 0, "y": 0, "data": []
            }
            data_tag = layer.find('data')
            if data_tag is not None and data_tag.attrib.get('encoding') == 'csv':
                l_data['data'] = [int(x.strip()) for x in data_tag.text.strip().split(',') if x.strip()]
            map_data['layers'].append(l_data)

    # Object groups
    for objgroup in root.findall('objectgroup'):
        og_data = {
            "id": int(objgroup.attrib['id']),
            "name": objgroup.attrib['name'],
            "type": "objectgroup",
            "visible": True, "opacity": 1.0, "objects": []
        }
        for obj in objgroup.findall('object'):
            o = {
                "id": int(obj.attrib['id']),
                "gid": int(obj.attrib.get('gid', 0)),
                "x": float(obj.attrib['x']),
                "y": float(obj.attrib['y']),
                "width": float(obj.attrib.get('width', 0)),
                "height": float(obj.attrib.get('height', 0)),
                "name": obj.attrib.get('name', ""),
                "type": obj.attrib.get('type', ""),
                "visible": True
            }
            og_data['objects'].append(o)
        map_data['layers'].append(og_data)

    with open(json_path, 'w') as f:
        json.dump(map_data, f, indent=2)

assets_dir = "/home/Sahi0045/Documents/interactiveideas/public/assets/fan-tasy"
for file in os.listdir(assets_dir):
    if file.endswith(".tmx"):
        tmx_to_json(os.path.join(assets_dir, file), os.path.join(assets_dir, file.replace(".tmx", ".tmj")))
        print(f"Converted {file} to JSON with embedded tilesets")
