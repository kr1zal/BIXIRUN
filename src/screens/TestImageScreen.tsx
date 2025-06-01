import React from 'react';
import { View, Image } from 'react-native';

export default function TestImageScreen() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Image
                source={{ uri: 'https://wesrkttwjuvclvfkuxzx.supabase.co/storage/v1/object/public/products/supplements/magn-b6/m+b4.jpg' }}
                style={{ width: 200, height: 200, backgroundColor: '#eee' }}
                resizeMode="cover"
            />
        </View>
    );
} 