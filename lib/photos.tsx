/**
 * Meal photos: one photo identity from the camera through the chat, the
 * receipt and the diary. Sample photos are decoded once and reused.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ComponentProps, type PropsWithChildren } from "react";
import { Image, useImage, type ImageRef } from "expo-image";
import { sampleMeals, type SampleMealId } from "@/constants/content";
import { isSampleMeal, type MealPhoto } from "./diary";

export function mealPhotoSource(photo?: MealPhoto) {
  const sample = photo?.sample;
  if (photo?.uri) return { uri: photo.uri };
  if (isSampleMeal(sample)) return sampleMeals[sample].image;
  return undefined;
}

type Decoded = Partial<Record<SampleMealId, ImageRef>>;
const DecodedPhotos = createContext<Decoded>({});

/** One decoder per photo keeps hook counts stable when content.ts changes. */
function Decode({ id, onReady }: { id: SampleMealId; onReady: (id: SampleMealId, image: ImageRef) => void }) {
  const image = useImage(sampleMeals[id].image, { maxWidth: 900 });
  useEffect(() => {
    if (image) onReady(id, image);
  }, [id, image, onReady]);
  return null;
}

/** Decodes the sample photos while the welcome is showing. */
export function MealPhotosProvider({ children }: PropsWithChildren) {
  const [decoded, setDecoded] = useState<Decoded>({});
  const ready = useCallback(
    (id: SampleMealId, image: ImageRef) =>
      setDecoded((old) => (old[id] === image ? old : { ...old, [id]: image })),
    [],
  );
  return (
    <DecodedPhotos.Provider value={decoded}>
      {(Object.keys(sampleMeals) as SampleMealId[]).map((id) => (
        <Decode key={id} id={id} onReady={ready} />
      ))}
      {children}
    </DecodedPhotos.Provider>
  );
}

export function useMealPhotoSource(photo?: MealPhoto) {
  const decoded = useContext(DecodedPhotos);
  const sample = photo?.sample;
  if (!photo?.uri && isSampleMeal(sample)) return decoded[sample] ?? mealPhotoSource(photo);
  return mealPhotoSource(photo);
}

export function MealImage({ photo, ...props }: Omit<ComponentProps<typeof Image>, "source"> & { photo?: MealPhoto }) {
  const source = useMealPhotoSource(photo);
  return <Image {...props} source={source} />;
}
