import { useEffect, useState } from "react";

type AssetImageState = {
  images: Record<string, HTMLImageElement>;
  errors: Record<string, string>;
  loading: boolean;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.crossOrigin = "anonymous";

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load asset "${src}".`));
    image.src = src;
  });
}

export function useAssetImages(assetBindings: Record<string, string>) {
  const [state, setState] = useState<AssetImageState>({
    images: {},
    errors: {},
    loading: false
  });

  useEffect(() => {
    let cancelled = false;
    const entries = Object.entries(assetBindings).filter(([, src]) => src);

    if (entries.length === 0) {
      setState({
        images: {},
        errors: {},
        loading: false
      });
      return undefined;
    }

    setState((current) => ({
      images: current.images,
      errors: {},
      loading: true
    }));

    Promise.all(
      entries.map(async ([slot, src]) => {
        try {
          const image = await loadImage(src);
          return {
            slot,
            image,
            error: null as string | null
          };
        } catch (error) {
          return {
            slot,
            image: null,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      })
    ).then((results) => {
      if (cancelled) {
        return;
      }

      const images: Record<string, HTMLImageElement> = {};
      const errors: Record<string, string> = {};

      for (const result of results) {
        if (result.image) {
          images[result.slot] = result.image;
        }

        if (result.error) {
          errors[result.slot] = result.error;
        }
      }

      setState({
        images,
        errors,
        loading: false
      });
    });

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(assetBindings)]);

  return state;
}
